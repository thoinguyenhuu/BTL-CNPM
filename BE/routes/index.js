import { Router } from "express";
import courseRoutes from "./routes/course.route.js";

const router = Router();

router.use('/api', courseRoutes);

export default router;