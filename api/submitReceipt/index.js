const multipart = require("parse-multipart-data");
const { v4: uuidv4 } = require("uuid");

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

const allowedMimeTypes = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/heic",
  "image/heif",
  "application/pdf"
];

module.exports = async function (context, req) {
  try {
    const contentType = req.headers["content-type"] || req.headers["Content-Type"];

    if (!contentType || !contentType.includes("multipart/form-data")) {
      context.res = {
        status: 400,
        body: {
          success: false,
          message: "Request must be multipart/form-data."
        }
      };
      return;
    }

    const boundary = multipart.getBoundary(contentType);
    const parts = multipart.parse(req.body, boundary);

    const fields = {};
    const files = {};

    for (const part of parts) {
      if (part.filename) {
        files[part.name] = part;
      } else {
        fields[part.name] = part.data.toString("utf8").trim();
      }
    }

    const legalName = fields.legalName;
    const page1 = files.page1;

    if (!legalName) {
      context.res = {
        status: 400,
        body: {
          success: false,
          message: "Full legal name is required."
        }
      };
      return;
    }

    if (!page1) {
      context.res = {
        status: 400,
        body: {
          success: false,
          message: "Page 1 is required."
        }
      };
      return;
    }

    const receivedFiles = [];

    for (const fieldName of ["page1", "page2", "page3"]) {
      const file = files[fieldName];

      if (!file) {
        continue;
      }

      if (file.data.length > MAX_FILE_SIZE_BYTES) {
        context.res = {
          status: 400,
          body: {
            success: false,
            message: `${fieldName} exceeds the 10 MB size limit.`
          }
        };
        return;
      }

      if (!allowedMimeTypes.includes(file.type)) {
        context.res = {
          status: 400,
          body: {
            success: false,
            message: `${fieldName} has an unsupported file type.`
          }
        };
        return;
      }

      receivedFiles.push({
        fieldName,
        filename: file.filename,
        contentType: file.type,
        sizeBytes: file.data.length
      });
    }

    const submissionId = uuidv4();

    context.res = {
      status: 200,
      headers: {
        "Content-Type": "application/json"
      },
      body: {
        success: true,
        message: "Submission received and validated successfully.",
        submissionId,
        legalName,
        filesReceived: receivedFiles
      }
    };
  } catch (error) {
    context.log.error(error);

    context.res = {
      status: 500,
      body: {
        success: false,
        message: "An unexpected error occurred while processing the submission."
      }
    };
  }
};