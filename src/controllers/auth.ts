import { RequestHandler } from "express";
import UserModel from "src/models/user";

export const createNewUser: RequestHandler = async (req, res): Promise<void> => {
  const { email, password, name } = req.body;

  if (!name) {
    res.status(422).json({ message: "Name is missing!" });
    return; 
  }
  if (!email) {
    res.status(422).json({ message: "Email is missing!" });
    return;
  }
  if (!password) {
    res.status(422).json({ message: "Password is missing!" });
    return;
  }


  const existingUser = await UserModel.findOne({ email });
  if (existingUser) {
    res.status(401).json({ message: "Unauthorized request, email is already in use!" });
    return;
  }
  
};
