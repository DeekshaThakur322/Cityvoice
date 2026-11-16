import express from "express";
import { register, login, getMe, updateProfile, changePassword,  } from "../controller/authController.js";
import { protect } from "../../utils/protect.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", protect, getMe);
router.put("/profile",protect, updateProfile);
router.put("/change-password", protect, changePassword)


export default router;