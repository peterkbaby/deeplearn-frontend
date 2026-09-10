"use client";

import { useActionState, useRef, useState, useTransition } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { Eye, LoaderCircle, Trash2, Upload, X } from "lucide-react";
import { deletePhotoAction, uploadAction } from "@/lib/actions";

async function cropImage(source: string, crop: Area): Promise<Blob> {
  const image = new Image();
  image.src = source;
  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(new Error("Could not read that image."));
  });
  const canvas = document.createElement("canvas");
  canvas.width = crop.width;
  canvas.height = crop.height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Your browser cannot crop this image.");
  context.drawImage(
    image,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    crop.width,
    crop.height,
  );
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) =>
        blob ? resolve(blob) : reject(new Error("Could not crop that image.")),
      "image/jpeg",
      0.9,
    );
  });
}

export function ProfilePhotoManager({
  photo,
  name,
  compact = false,
}: {
  photo: string | null;
  name: string;
  compact?: boolean;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [area, setArea] = useState<Area | null>(null);
  const [viewer, setViewer] = useState(false);
  const [uploadState, upload, uploadPending] = useActionState(uploadAction, {});
  const [deleteState, deletePhoto, deletePending] = useActionState(
    deletePhotoAction,
    {},
  );
  const [busy, startTransition] = useTransition();

  function chooseFile(file: File | undefined) {
    if (!file) return;
    if (
      file.size > 2 * 1024 * 1024 ||
      !["image/jpeg", "image/png", "image/webp"].includes(file.type)
    )
      return;
    setSelected(URL.createObjectURL(file));
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setArea(null);
  }
  function closeCropper() {
    if (selected) URL.revokeObjectURL(selected);
    setSelected(null);
    if (input.current) input.current.value = "";
  }
  function saveCrop() {
    if (!selected || !area) return;
    startTransition(async () => {
      try {
        const blob = await cropImage(selected, area);
        const form = new FormData();
        form.set(
          "file",
          new File([blob], "profile-photo.jpg", { type: "image/jpeg" }),
        );
        await upload(form);
        closeCropper();
      } catch {
        // The server action displays API errors; this handles local canvas failures.
      }
    });
  }
  const initials = name.slice(0, 1).toUpperCase();
  return (
    <div className={`photo-manager${compact ? " compact" : ""}`}>
      <div className="photo-avatar-wrap">
        <div className="photo-avatar">
          {photo ? <img src={photo} alt={`${name}’s profile`} /> : initials}
        </div>
        <button
          className="photo-action upload-action"
          type="button"
          onClick={() => input.current?.click()}
          aria-label={
            photo ? "Upload a new profile photo" : "Upload a profile photo"
          }
        >
          <Upload size={15} />
        </button>
        {photo && (
          <button
            className="photo-action view-action"
            type="button"
            onClick={() => setViewer(true)}
            aria-label="View profile photo"
          >
            <Eye size={15} />
          </button>
        )}
      </div>
      {!compact && (
        <div>
          <strong>{photo ? "Profile photo" : "Add a profile photo"}</strong>
          <p>
            {photo
              ? "Use the eye to view or the upload icon to replace it."
              : "Upload a square photo to make your account yours."}
          </p>
        </div>
      )}
      <input
        ref={input}
        className="photo-input-hidden"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={(event) => chooseFile(event.target.files?.[0])}
      />
      {uploadState.error && (
        <p className="field-error" role="alert">
          {uploadState.error}
        </p>
      )}
      {deleteState.error && (
        <p className="field-error" role="alert">
          {deleteState.error}
        </p>
      )}
      {(selected || uploadPending || busy) && selected && (
        <div
          className="photo-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="crop-title"
        >
          <div className="crop-card">
            <div className="crop-header">
              <div>
                <span className="eyebrow">MAKE IT FIT</span>
                <h2 id="crop-title">Crop your photo.</h2>
              </div>
              <button
                className="modal-close"
                type="button"
                onClick={closeCropper}
                aria-label="Cancel crop"
              >
                <X size={18} />
              </button>
            </div>
            <div className="crop-area">
              <Cropper
                image={selected}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={(_, croppedAreaPixels) =>
                  setArea(croppedAreaPixels)
                }
              />
            </div>
            <label className="zoom-control">
              Zoom
              <input
                type="range"
                min={1}
                max={3}
                step={0.05}
                value={zoom}
                onChange={(event) => setZoom(Number(event.target.value))}
              />
            </label>
            <div className="crop-actions">
              <button
                className="button secondary"
                type="button"
                onClick={closeCropper}
              >
                Cancel
              </button>
              <button
                className="button primary"
                type="button"
                onClick={saveCrop}
                disabled={!area || busy}
              >
                {busy ? (
                  <LoaderCircle size={16} className="spin" />
                ) : (
                  "Use this photo"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      {viewer && photo && (
        <div
          className="photo-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="view-title"
        >
          <div className="view-card">
            <div className="crop-header">
              <div>
                <span className="eyebrow">YOUR PROFILE PHOTO</span>
                <h2 id="view-title">A little more you.</h2>
              </div>
              <button
                className="modal-close"
                type="button"
                onClick={() => setViewer(false)}
                aria-label="Close photo viewer"
              >
                <X size={18} />
              </button>
            </div>
            <img className="photo-full" src={photo} alt={`${name}’s profile`} />
            <form action={deletePhoto} onSubmit={() => setViewer(false)}>
              <button
                className="delete-button"
                type="submit"
                disabled={deletePending}
              >
                {deletePending ? (
                  <LoaderCircle size={15} className="spin" />
                ) : (
                  <Trash2 size={15} />
                )}{" "}
                Delete photo
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
