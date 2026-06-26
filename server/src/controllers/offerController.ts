import { Response } from "express";
import { AuthRequest } from "../middlewares/authMiddleware";
import { OfferLetter } from "../models/OfferLetter";
import { User } from "../models/User";
import { Intern } from "../models/Intern";
import { generateOfferLetterPDF } from "../services/pdfService";
import { createNotification } from "../services/notificationService";
import { logActivity } from "../services/activityService";
import { getStorageProvider } from "../services/storageService";
import fs from "fs";
import path from "path";

// POST /api/offer-letters - Lead generates offer letter for intern
export const generateOffer = async (req: AuthRequest, res: Response): Promise<void> => {
  const { internId, salaryDetails, startDate } = req.body;

  if (!req.user) {
    res.status(401).json({ message: "Not authenticated." });
    return;
  }

  if (req.user.role !== "Lead") {
    res.status(403).json({ message: "Access forbidden: only Leads can generate offer letters." });
    return;
  }

  if (!internId || !salaryDetails || !startDate) {
    res.status(400).json({ message: "Intern ID, salary details, and start date are required." });
    return;
  }

  try {
    const internUser = await User.findById(internId);
    if (!internUser || internUser.role !== "Intern") {
      res.status(404).json({ message: "Intern user not found." });
      return;
    }

    const start = new Date(startDate);
    if (isNaN(start.getTime())) {
      res.status(400).json({ message: "Invalid start date format." });
      return;
    }

    const internProfile = await Intern.findOne({ userId: internId });
    const track = internProfile?.track || "Technology";

    // 1. Create Offer Letter record to get ID
    const offer = new OfferLetter({
      internId,
      salaryDetails,
      startDate: start,
      downloadPath: "Temporary", // Filled below
      generatedBy: req.user.id as any,
      documentType: "OfferLetter",
      status: "Issued",
      version: 1
    });
    await offer.save();

    // 2. Generate temp file path
    const tempDir = path.join(__dirname, "../../../uploads/temp");
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    const fileName = `offer-${offer._id}-${Date.now()}.pdf`;
    const tempFilePath = path.join(tempDir, fileName);

    await generateOfferLetterPDF(
      internUser.name,
      track,
      salaryDetails,
      start,
      tempFilePath
    );

    // Save to storage layer
    const storageProvider = getStorageProvider();
    const finalDownloadPath = await storageProvider.saveFile(tempFilePath, "offer-letters", fileName);

    // 3. Update downloadPath in MongoDB
    offer.downloadPath = finalDownloadPath;
    await offer.save();

    // 4. Notify Intern
    await createNotification(
      internId,
      "Internship Offer Letter Issued",
      "An official offer letter has been generated for you. Please download and accept it.",
      "Offers",
      "success"
    );

    // 5. Log central activity
    await logActivity(
      req.user.id,
      req.user.name,
      "OFFER_LETTER_GENERATED",
      `Generated offer letter for intern: ${internUser.name} (Stipend: ${salaryDetails})`,
      "Offers",
      "HIGH",
      req
    );

    res.status(201).json(offer);
  } catch (error) {
    res.status(500).json({ message: `Server error: ${(error as Error).message}` });
  }
};

// GET /api/offer-letters/download/:id - Stream generated Offer Letter PDF
export const downloadOffer = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;

  try {
    const offer = await OfferLetter.findById(id).populate("internId", "name");
    if (!offer) {
      res.status(404).json({ message: "Offer letter record not found." });
      return;
    }

    // If stored in cloud bucket, redirect the user directly to the object URL
    if (offer.downloadPath.startsWith("http://") || offer.downloadPath.startsWith("https://")) {
      res.redirect(offer.downloadPath);
      return;
    }

    // Guard: Interns can only download their own offer letter
    if (req.user && req.user.role === "Intern" && req.user.id !== offer.internId._id.toString()) {
      res.status(403).json({ message: "Access forbidden: you cannot access other interns' documents." });
      return;
    }

    const uploadDir = path.join(__dirname, "../../../uploads/offer-letters");
    const matches = offer.downloadPath.match(/download\/(.+)$/);
    const offerId = matches ? matches[1] : id;

    // Find PDF file on disk
    const files = fs.readdirSync(uploadDir);
    const matchedFile = files.find(f => f.startsWith(`offer-${offerId}`));

    if (!matchedFile) {
      res.status(404).json({ message: "PDF document file not found on the server disk." });
      return;
    }

    const fullPath = path.join(uploadDir, matchedFile);
    res.setHeader("Content-Type", "application/pdf");
    res.download(fullPath, `OfferLetter_${(offer.internId as any).name.replace(/\s+/g, "_")}.pdf`);
  } catch (error) {
    res.status(500).json({ message: `Server error: ${(error as Error).message}` });
  }
};

// GET /api/offer-letters - List generated offer letters
export const getAllOffers = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: "Not authenticated." });
    return;
  }

  try {
    let query: any = {};
    if (req.user.role === "Intern") {
      query.internId = req.user.id;
    }

    const list = await OfferLetter.find(query)
      .populate("internId", "name email avatar")
      .populate("generatedBy", "name")
      .sort({ createdAt: -1 });

    res.status(200).json(list);
  } catch (error) {
    res.status(500).json({ message: `Server error: ${(error as Error).message}` });
  }
};
