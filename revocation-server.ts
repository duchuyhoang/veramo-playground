import express from "express";
const app = express();

app.get("/revocation/:id", (req, res) => {
  const id = req.params.id;
  res.json({
    "@context": "https://w3id.org/vc-revocation-list-2020/v1",
    id: "https://example.com/status/12345",
    type: "RevocationList2020Status",
    status: {
      index: 1500, // Index of the credential in the revocation list
      revoked: true, // Indicates that the credential is not revoked (active)
    },
  });
});

app.listen(3000, () => {
  console.log("Revocation server listen");
});
