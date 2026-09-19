import userModel from "../models/userModel.js";

export function getAllUsers(req, res) {
  userModel
    .find()
    .then((users) => {
      res.status(200).json(users);
    })
    .catch((err) => {
      res.status(500).json({ error: "Error fetching users" });
    });
}
