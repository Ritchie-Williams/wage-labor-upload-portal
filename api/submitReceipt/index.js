const { v4: uuidv4 } = require("uuid");

module.exports = async function (context, _req) {
  const submissionId = uuidv4();

  context.res = {
    status: 200,
    headers: {
      "Content-Type": "application/json"
    },
    body: {
      success: true,
      message: "Submission endpoint reached successfully.",
      submissionId
    }
  };
};