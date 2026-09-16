import { Hono } from "hono";
import { getAuth, requireAuth, requireRole } from "../middleware/auth";
import { badRequest } from "../middleware/error";
import { listPlaceImages, setPlaceImage } from "../services/places";
import { SetPlaceImageSchema } from "../../../shared/types";
import { getStorage, MAX_UPLOAD_BYTES } from "../providers/storage";

export const placesRoutes = new Hono()
  /**
   * List configured place images. Can be queried by district, mandal, or village.
   * Public to all authenticated users so place cards display landmarks.
   */
  .get("/images", async (c) => {
    const district = c.req.query("district")?.trim() || undefined;
    const mandal = c.req.query("mandal")?.trim() || undefined;
    const village = c.req.query("village")?.trim() || undefined;

    const images = await listPlaceImages({ district, mandal, village });
    return c.json({ images });
  })

  /**
   * Set or update place image URL & caption (Admin & Super Admin only).
   */
  .put("/image", requireAuth, requireRole("admin", "super_admin"), async (c) => {
    const { user } = getAuth(c);
    const body = await c.req.json().catch(() => null);
    const parsed = SetPlaceImageSchema.parse(body);

    const result = await setPlaceImage(user, parsed);
    return c.json({ ok: true, placeImage: result });
  })

  /**
   * Direct file upload for place images (Admin & Super Admin only).
   * Saves image file to storage provider and returns public file URL.
   */
  .post("/upload", requireAuth, requireRole("admin", "super_admin"), async (c) => {
    getAuth(c);
    const body = await c.req.parseBody();
    const file = body["file"];

    if (!(file instanceof File)) throw badRequest("Missing 'file' field");
    if (file.size > MAX_UPLOAD_BYTES) throw badRequest("File too large (max 10 MB)");
    const mime = file.type || "application/octet-stream";
    const ALLOWED_IMAGE_MIMES = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/heic",
      "image/gif",
    ];
    if (!ALLOWED_IMAGE_MIMES.includes(mime)) {
      throw badRequest(`Unsupported file type: ${mime}. Please upload an image.`);
    }

    const stored = await getStorage().save(Buffer.from(await file.arrayBuffer()), mime);
    return c.json({ url: `/api/files/${stored.key}`, key: stored.key }, 201);
  });
