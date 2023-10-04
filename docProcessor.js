const mammoth = require("mammoth");
const fs = require("fs");
const { PDFDocument } = require("pdf-lib");

async function processDocument(data) {
    try {
        // Read the Word file from the local directory
        const buffer = fs.readFileSync("./doctemplate/0001.docx");

        // Convert the docx file to HTML
        const { value: html } = await mammoth.convertToHtml({ buffer: buffer });

        // Replace the placeholders with actual data
        const replacedHtml = html
            .replace("[*propertyaddress*]", data.S0_propertyaddress || "N/A")
            .replace("[*tenantname*]", data.S0_tenantname || "N/A")
            .replace("[*inspectiondate*]", data.S0_inspectiondate || "N/A")
            .replace("[*inspectedby*]", data.S0_inspectedby || "N/A");

        // Create a new PDF and add the processed HTML content
        const pdfDoc = await PDFDocument.create();
        const [page] = await pdfDoc.addPage([600, 400]);
        page.drawText(replacedHtml, {
            x: 50,
            y: 350,
            size: 12,
        });

        // Serialize the PDF to bytes
        const pdfBytes = await pdfDoc.save();

        return pdfBytes;
    } catch (error) {
        console.error("Error processing document:", error);
        throw new Error("Document processing failed.");
    }
}

module.exports = { processDocument };
