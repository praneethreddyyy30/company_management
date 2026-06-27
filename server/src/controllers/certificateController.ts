import { Response } from "express";
import { AuthRequest } from "../middlewares/authMiddleware";
import { Certificate } from "../models/Certificate";
import { Intern } from "../models/Intern";
import { User } from "../models/User";
import { generateCertificatePDF } from "../services/pdfService";
import { createNotification } from "../services/notificationService";
import { logActivity } from "../services/activityService";
import { getStorageProvider } from "../services/storageService";
import fs from "fs";
import path from "path";

// Helper to evaluate eligibility based on environment variables
const evaluateEligibility = async (userId: string): Promise<{ eligible: boolean; reason?: string; metrics?: any }> => {
  const minCompletion = Number(process.env.CERTIFICATE_MIN_COMPLETION || 85);
  const minAttendance = Number(process.env.CERTIFICATE_MIN_ATTENDANCE || 80);

  const intern = await Intern.findOne({ userId });
  if (!intern) {
    return { eligible: false, reason: "No intern profile associated with your user account." };
  }

  const metrics = {
    status: intern.status,
    taskCompletionPercentage: intern.taskCompletionPercentage || 0,
    attendancePercentage: intern.attendancePercentage || 0,
    minCompletion,
    minAttendance
  };

  // Completed status is automatically eligible
  if (intern.status === "completed") {
    return { eligible: true, metrics };
  }

  // Active status requires meeting thresholds
  if (intern.status === "active") {
    const meetTask = metrics.taskCompletionPercentage >= minCompletion;
    const meetAttendance = metrics.attendancePercentage >= minAttendance;

    if (meetTask && meetAttendance) {
      return { eligible: true, metrics };
    }

    const reasons: string[] = [];
    if (!meetTask) {
      reasons.push(`Task completion (${metrics.taskCompletionPercentage}%) is below the minimum required ${minCompletion}%.`);
    }
    if (!meetAttendance) {
      reasons.push(`Attendance rate (${metrics.attendancePercentage}%) is below the minimum required ${minAttendance}%.`);
    }

    return { eligible: false, reason: reasons.join(" "), metrics };
  }

  return { eligible: false, reason: `Your internship status '${intern.status}' is not eligible for certificate issues.`, metrics };
};

// GET /api/certificates/eligibility - Check current user's eligibility
export const checkEligibility = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: "Not authenticated." });
    return;
  }

  try {
    const result = await evaluateEligibility(req.user.id);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: `Server error: ${(error as Error).message}` });
  }
};

// POST /api/certificates/request - Intern requests certificate
export const requestCertificate = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: "Not authenticated." });
    return;
  }

  if (req.user.role !== "Intern") {
    res.status(403).json({ message: "Access forbidden: only interns request certificates." });
    return;
  }

  try {
    // 1. Verify eligibility
    const check = await evaluateEligibility(req.user.id);
    if (!check.eligible) {
      res.status(400).json({ message: `You are not eligible to request a certificate: ${check.reason}` });
      return;
    }

    // 2. Check for duplicate requests (already pending or approved)
    const existing = await Certificate.findOne({
      internId: req.user.id,
      status: { $in: ["Pending", "Approved"] }
    });

    if (existing) {
      res.status(400).json({ message: `You already have a certificate request which is currently ${existing.status}.` });
      return;
    }

    // 3. Create request record with unique cert number
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const certificateNumber = `KG-CERT-${dateStr}-${randomSuffix}`;

    const request = new Certificate({
      internId: req.user.id,
      certificateNumber,
      status: "Pending",
      documentType: "Certificate",
      version: 1,
      requestDate: new Date(),
    });
    await request.save();

    // 4. Notify assigned Lead (mentor) or Admin if none assigned
    const intern = await Intern.findOne({ userId: req.user.id });
    if (intern && intern.mentorId) {
      await createNotification(
        intern.mentorId,
        "Certificate Request Submitted",
        `${req.user.name} requested an internship completion certificate.`,
        "Certificates",
        "warning"
      );
    } else {
      const admins = await User.find({ role: "Admin" });
      for (const admin of admins) {
        await createNotification(
          admin._id,
          "Certificate Request (Unassigned Intern)",
          `${req.user.name} requested a completion certificate.`,
          "Certificates",
          "warning"
        );
      }
    }

    // 5. Log activity
    await logActivity(
      req.user.id,
      req.user.name,
      "CERTIFICATE_REQUESTED",
      `Submitted a request for certificate: ${certificateNumber}`,
      "Certificates",
      "LOW",
      req
    );

    res.status(201).json(request);
  } catch (error) {
    res.status(500).json({ message: `Server error: ${(error as Error).message}` });
  }
};

// PUT /api/certificates/:id/approve - Lead or Admin approves and compiles PDF
export const approveCertificate = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const { grade = "A" } = req.body;

  if (!req.user) {
    res.status(401).json({ message: "Not authenticated." });
    return;
  }

  if (req.user.role !== "Lead" && req.user.role !== "Admin") {
    res.status(403).json({ message: "Access forbidden: only Leads and Admins can approve certificates." });
    return;
  }

  try {
    const certificate = await Certificate.findById(id).populate("internId", "name email");
    if (!certificate) {
      res.status(404).json({ message: "Certificate request not found." });
      return;
    }

    if (certificate.status !== "Pending") {
      res.status(400).json({ message: `Certificate request has already been processed: status is ${certificate.status}` });
      return;
    }

    // Lead isolation check
    if (req.user.role === "Lead") {
      const intern = await Intern.findOne({ userId: certificate.internId._id });
      if (!intern || !intern.mentorId || intern.mentorId.toString() !== req.user.id) {
        res.status(403).json({ message: "Access forbidden: you can only approve certificates for your assigned interns." });
        return;
      }
    }

    // Determine temp file path
    const tempDir = path.join(__dirname, "../../../uploads/temp");
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    const fileName = `cert-${certificate._id}-${Date.now()}.pdf`;
    const tempFilePath = path.join(tempDir, fileName);

    // Get Intern profile
    const intern = await Intern.findOne({ userId: certificate.internId._id });
    const track = intern?.track || "Technology";

    // Generate PDFKit Certificate file
    const internName = (certificate.internId as any).name;
    await generateCertificatePDF(
      internName,
      track,
      grade,
      certificate.certificateNumber,
      new Date(),
      tempFilePath
    );

    // Save to storage layer
    const storageProvider = getStorageProvider();
    const finalDownloadPath = await storageProvider.saveFile(tempFilePath, "certificates", fileName);

    // Update Certificate metadata record
    certificate.status = "Approved";
    certificate.issuedAt = new Date();
    certificate.issuedBy = req.user.id as any;
    certificate.downloadPath = finalDownloadPath;
    certificate.grade = grade;
    await certificate.save();

    // Notify Intern cardholder
    await createNotification(
      certificate.internId._id,
      "Certificate Approved!",
      `Your completion certificate ${certificate.certificateNumber} is generated and ready for download.`,
      "Certificates",
      "success"
    );

    // Log Activity
    await logActivity(
      req.user.id,
      req.user.name,
      "CERTIFICATE_APPROVED",
      `Approved and generated certificate ${certificate.certificateNumber} for ${internName}`,
      "Certificates",
      "HIGH",
      req
    );

    res.status(200).json(certificate);
  } catch (error) {
    res.status(500).json({ message: `Server error: ${(error as Error).message}` });
  }
};

// PUT /api/certificates/:id/reject - Lead or Admin rejects certificate request
export const rejectCertificate = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const { reason = "Did not satisfy program completion parameters." } = req.body;

  if (!req.user) {
    res.status(401).json({ message: "Not authenticated." });
    return;
  }

  if (req.user.role !== "Lead" && req.user.role !== "Admin") {
    res.status(403).json({ message: "Access forbidden: only Leads and Admins can reject certificate requests." });
    return;
  }

  try {
    const certificate = await Certificate.findById(id).populate("internId", "name");
    if (!certificate) {
      res.status(404).json({ message: "Certificate request not found." });
      return;
    }

    if (certificate.status !== "Pending") {
      res.status(400).json({ message: `Request is already ${certificate.status}` });
      return;
    }

    // Lead isolation check
    if (req.user.role === "Lead") {
      const intern = await Intern.findOne({ userId: certificate.internId._id });
      if (!intern || !intern.mentorId || intern.mentorId.toString() !== req.user.id) {
        res.status(403).json({ message: "Access forbidden: you can only reject certificates for your assigned interns." });
        return;
      }
    }

    certificate.status = "Rejected";
    certificate.reason = reason;
    await certificate.save();

    // Notify Intern
    await createNotification(
      certificate.internId._id,
      "Certificate Request Rejected",
      `Your request for certificate has been rejected. Reason: ${reason}`,
      "Certificates",
      "error"
    );

    // Log Activity
    await logActivity(
      req.user.id,
      req.user.name,
      "CERTIFICATE_REJECTED",
      `Rejected certificate request for ${(certificate.internId as any).name}. Reason: ${reason}`,
      "Certificates",
      "MED",
      req
    );

    res.status(200).json(certificate);
  } catch (error) {
    res.status(500).json({ message: `Server error: ${(error as Error).message}` });
  }
};

// GET /api/certificates/download/:id - Stream generated Certificate PDF file
export const downloadCertificate = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;

  if (!req.user) {
    res.status(401).json({ message: "Not authenticated." });
    return;
  }

  try {
    const cert = await Certificate.findById(id).populate("internId", "name");
    if (!cert) {
      res.status(404).json({ message: "Certificate document record not found." });
      return;
    }

    if (cert.status !== "Approved" || !cert.downloadPath) {
      res.status(400).json({ message: "Certificate is not yet approved or generated." });
      return;
    }

    // Redirect if hosted remotely
    if (cert.downloadPath.startsWith("http://") || cert.downloadPath.startsWith("https://")) {
      res.redirect(cert.downloadPath);
      return;
    }

    // Guard: Interns can only download their own certificate
    if (req.user.role === "Intern" && req.user.id !== cert.internId._id.toString()) {
      res.status(403).json({ message: "Access forbidden: you cannot access other interns' documents." });
      return;
    }

    // Guard: Leads can only download their assigned interns' certificates
    if (req.user.role === "Lead") {
      const intern = await Intern.findOne({ userId: cert.internId._id });
      if (!intern || !intern.mentorId || intern.mentorId.toString() !== req.user.id) {
        res.status(403).json({ message: "Access forbidden: this certificate belongs to another Lead's intern." });
        return;
      }
    }

    // Extract filename from downloadPath or rebuild file path
    const uploadDir = path.join(__dirname, "../../../uploads/certificates");
    const matches = cert.downloadPath.match(/download\/(.+)$/);
    const certificateId = matches ? matches[1] : id;
    
    // Find matching PDF file in uploads
    const files = fs.readdirSync(uploadDir);
    const matchedFile = files.find(f => f.startsWith(`cert-${certificateId}`));

    if (!matchedFile) {
      res.status(404).json({ message: "PDF document file not found on the server disk." });
      return;
    }

    const fullPath = path.join(uploadDir, matchedFile);
    res.setHeader("Content-Type", "application/pdf");
    res.download(fullPath, `Certificate_${(cert.internId as any).name.replace(/\s+/g, "_")}.pdf`);
  } catch (error) {
    res.status(500).json({ message: `Server error: ${(error as Error).message}` });
  }
};

// GET /api/certificates - List all certificate requests
export const getAllCertificates = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: "Not authenticated." });
    return;
  }

  try {
    let query: any = {};
    
    // Interns: see their own requests
    if (req.user.role === "Intern") {
      query.internId = req.user.id;
    }

    // Leads: see requests of their assigned interns
    if (req.user.role === "Lead") {
      const myInterns = await Intern.find({ mentorId: req.user.id });
      const myInternUserIds = myInterns.map((i) => i.userId);
      query.internId = { $in: myInternUserIds };
    }

    const list = await Certificate.find(query)
      .populate("internId", "name email avatar")
      .populate("issuedBy", "name")
      .sort({ requestDate: -1 });

    res.status(200).json(list);
  } catch (error) {
    res.status(500).json({ message: `Server error: ${(error as Error).message}` });
  }
};
