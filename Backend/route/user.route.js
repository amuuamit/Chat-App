import express from "express";
import {
  getUserProfile,
  login,
  logout,
  signup,
  searchUsers,
  getAllUsers,
} from "../controllers/user.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout);
router.get("/getUserProfile", protect, getUserProfile);
router.get("/profile", protect, getUserProfile);
router.get("/search", protect, searchUsers);
router.get("/all", protect, getAllUsers);

export default router;
