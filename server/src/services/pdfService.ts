import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";

// Ensure directories exist helper
const ensureDirectoryExists = (filePath: string) => {
  const dirname = path.dirname(filePath);
  if (!fs.existsSync(dirname)) {
    fs.mkdirSync(dirname, { recursive: true });
  }
};

/**
 * Generates a premium PDF Certificate.
 */
export const generateCertificatePDF = (
  internName: string,
  trackName: string,
  grade: string,
  certNumber: string,
  issueDate: Date,
  outputPath: string
): Promise<void> => {
  return new Promise((resolve, reject) => {
    try {
      ensureDirectoryExists(outputPath);
      
      const doc = new PDFDocument({
        layout: "landscape",
        size: "A4",
        margin: 40,
      });

      const writeStream = fs.createWriteStream(outputPath);
      doc.pipe(writeStream);

      // 1. Draw Gold/Black Double Border Accent
      doc.rect(20, 20, doc.page.width - 40, doc.page.height - 40)
         .lineWidth(4)
         .stroke("#B8860B"); // Gold border

      doc.rect(28, 28, doc.page.width - 56, doc.page.height - 56)
         .lineWidth(1.5)
         .stroke("#1A1A24"); // Sleek dark border

      // 2. Logo / Company Header
      doc.font("Helvetica-Bold")
         .fillColor("#06C8D8") // Cyan corporate color
         .fontSize(28)
         .text("KLASSYGO", 0, 80, { align: "center" });

      doc.font("Helvetica")
         .fillColor("#FFFFFF")
         .fontSize(10)
         .text("INSIGHTS HUB & HRM ENGINE", 0, 110, { align: "center", characterSpacing: 1.5 });

      // 3. Certificate Title
      doc.moveDown(2);
      doc.font("Helvetica-Bold")
         .fillColor("#EAEAEA")
         .fontSize(36)
         .text("CERTIFICATE OF COMPLETION", 0, 150, { align: "center" });

      doc.font("Helvetica-Oblique")
         .fillColor("#8E8E9F")
         .fontSize(14)
         .text("This is proudly presented to", 0, 200, { align: "center" });

      // 4. Intern Name
      doc.moveDown(1);
      doc.font("Helvetica-Bold")
         .fillColor("#7C3AED") // Violet primary accent
         .fontSize(32)
         .text(internName, 0, 235, { align: "center" });

      // 5. Completion Description
      doc.moveDown(1.5);
      doc.font("Helvetica")
         .fillColor("#EAEAEA")
         .fontSize(13)
         .text(
           `for successfully completing their internship training program as a ${trackName} Developer.`,
           50,
           290,
           { align: "center", width: doc.page.width - 100, lineGap: 4 }
         );

      doc.text(
        `Grade Awarded: ${grade}  |  Program Completion Date: ${issueDate.toDateString()}`,
        0,
        320,
        { align: "center" }
      );

      // 6. Signatures and Certificate metadata
      doc.moveDown(3);
      
      // Left side: Authorized Signature line
      doc.moveTo(100, 440)
         .lineTo(280, 440)
         .lineWidth(1)
         .stroke("#8E8E9F");

      doc.font("Helvetica-Bold")
         .fillColor("#EAEAEA")
         .fontSize(11)
         .text("Vikram Iyer", 100, 448, { width: 180, align: "center" });
      
      doc.font("Helvetica")
         .fillColor("#8E8E9F")
         .fontSize(9)
         .text("HR & Operations Lead", 100, 460, { width: 180, align: "center" });

      // Right side: Certificate Number metadata
      doc.moveTo(doc.page.width - 280, 440)
         .lineTo(doc.page.width - 100, 440)
         .stroke("#8E8E9F");

      doc.font("Helvetica-Bold")
         .fillColor("#EAEAEA")
         .fontSize(10)
         .text(certNumber, doc.page.width - 280, 448, { width: 180, align: "center" });

      doc.font("Helvetica")
         .fillColor("#8E8E9F")
         .fontSize(9)
         .text("Verification License Key", doc.page.width - 280, 460, { width: 180, align: "center" });

      doc.end();

      writeStream.on("finish", () => {
        resolve();
      });

      writeStream.on("error", (err) => {
        reject(err);
      });
    } catch (e) {
      reject(e);
    }
  });
};

/**
 * Generates a professional PDF Offer Letter.
 */
export const generateOfferLetterPDF = (
  internName: string,
  trackName: string,
  salaryDetails: string,
  startDate: Date,
  outputPath: string
): Promise<void> => {
  return new Promise((resolve, reject) => {
    try {
      ensureDirectoryExists(outputPath);

      const doc = new PDFDocument({
        size: "A4",
        margin: 50,
      });

      const writeStream = fs.createWriteStream(outputPath);
      doc.pipe(writeStream);

      // Header Brand
      doc.font("Helvetica-Bold")
         .fillColor("#06C8D8")
         .fontSize(24)
         .text("KLASSYGO", 50, 50);

      doc.font("Helvetica")
         .fillColor("#8E8E9F")
         .fontSize(8)
         .text("INSIGHTS HUB & HRM ENGINE", 50, 75);

      // Contact detail right side
      doc.font("Helvetica")
         .fillColor("#8E8E9F")
         .fontSize(9)
         .text("100 Corporate Drive\nTech Park, Sector 4\nBengaluru, KA - 560001\nHR@klassygo.com", 380, 50, { align: "right" });

      // Divider Line
      doc.moveTo(50, 115)
         .lineTo(doc.page.width - 50, 115)
         .lineWidth(1)
         .stroke("#8E8E9F");

      // Title & Date
      doc.moveDown(2);
      doc.font("Helvetica")
         .fillColor("#8E8E9F")
         .fontSize(10)
         .text(`Date: ${new Date().toLocaleDateString()}`);

      doc.moveDown(1.5);
      doc.font("Helvetica-Bold")
         .fillColor("#7C3AED")
         .fontSize(18)
         .text("LETTER OF INTERNSHIP OFFER", { align: "center" });

      // Body Copy
      doc.moveDown(2);
      doc.font("Helvetica")
         .fillColor("#EAEAEA")
         .fontSize(11)
         .text(`Dear ${internName},`, { lineGap: 6 });

      doc.moveDown(1);
      doc.text(
        `Following our interviews and assessments, we are thrilled to offer you the position of Developer Intern in our ${trackName} division at KLASSYGO. We believe your skills and passion will be a tremendous fit for our software development cohorts.`,
        { lineGap: 6, align: "justify" }
      );

      doc.moveDown(1);
      doc.text(
        "Please review the core details of your internship program detailed below:",
        { lineGap: 6 }
      );

      // Details Table Block
      doc.moveDown(1.5);
      doc.rect(50, doc.y, doc.page.width - 100, 110)
         .fillColor("rgba(255, 255, 255, 0.02)")
         .strokeColor("rgba(255, 255, 255, 0.08)")
         .lineWidth(1)
         .fillAndStroke();

      const tableStartY = doc.y + 15;
      doc.font("Helvetica-Bold").fillColor("#06C8D8").fontSize(10);
      doc.text("Position:", 70, tableStartY);
      doc.text("Start Date:", 70, tableStartY + 25);
      doc.text("Stipend Compensation:", 70, tableStartY + 50);
      doc.text("Office Location:", 70, tableStartY + 75);

      doc.font("Helvetica").fillColor("#EAEAEA");
      doc.text(`${trackName} Developer Intern`, 220, tableStartY);
      doc.text(startDate.toDateString(), 220, tableStartY + 25);
      doc.text(salaryDetails, 220, tableStartY + 50);
      doc.text("Remote / Bengaluru HQ", 220, tableStartY + 75);

      // Terms of service
      doc.y = tableStartY + 105;
      doc.moveDown(2.5);
      doc.text(
        "During this training internship, you will be assigned to a cohort batch under the mentorship of senior staff. You will submit daily progress updates via our standup tracker, check-in daily to manage attendance, and participate in performance summary reviews compiled weekly by our AI evaluator engine.",
        { lineGap: 6, align: "justify" }
      );

      doc.moveDown(1.5);
      doc.text(
        "Please confirm your acceptance of this internship offer by signing and returning this letter by email within 5 working days.",
        { lineGap: 6 }
      );

      // Signatures
      doc.moveDown(4);
      const signatureY = doc.y;

      doc.moveTo(50, signatureY)
         .lineTo(200, signatureY)
         .lineWidth(1)
         .stroke("#8E8E9F");
      
      doc.font("Helvetica-Bold")
         .fillColor("#EAEAEA")
         .fontSize(11)
         .text("Vikram Iyer", 50, signatureY + 8);
      
      doc.font("Helvetica")
         .fillColor("#8E8E9F")
         .fontSize(9)
         .text("HR Operations Lead, KLASSYGO", 50, signatureY + 20);

      doc.moveTo(doc.page.width - 200, signatureY)
         .lineTo(doc.page.width - 50, signatureY)
         .stroke("#8E8E9F");

      doc.font("Helvetica-Bold")
         .fillColor("#EAEAEA")
         .fontSize(11)
         .text("Intern Candidate Signature", doc.page.width - 200, signatureY + 8);

      doc.font("Helvetica")
         .fillColor("#8E8E9F")
         .fontSize(9)
         .text("Date: ____/____/________", doc.page.width - 200, signatureY + 20);

      doc.end();

      writeStream.on("finish", () => {
        resolve();
      });

      writeStream.on("error", (err) => {
        reject(err);
      });
    } catch (e) {
      reject(e);
    }
  });
};
