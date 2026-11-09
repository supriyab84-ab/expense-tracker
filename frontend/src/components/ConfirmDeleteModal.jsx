import React, { useEffect } from "react";
import "./ConfirmDeleteModal.css";

function ConfirmDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Delete Transaction",
  message = "Are you sure you want to delete this transaction?",
  itemTitle = "",
  itemAmount = null,
  isDeleting = false
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && !isDeleting) onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isDeleting, onClose]);

  if (!isOpen) return null;

  return (
    <div className="confirm-modal-backdrop" onClick={() => !isDeleting && onClose()}>
      <div className="confirm-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="confirm-modal-icon">🗑️</div>

        <h3 className="confirm-modal-title">{title}</h3>

        <p className="confirm-modal-message">{message}</p>

        {itemTitle && (
          <div className="confirm-item-preview">
            <span className="confirm-item-name">{itemTitle}</span>
            {itemAmount !== null && itemAmount !== undefined && (
              <span className="confirm-item-val">₹{Number(itemAmount).toLocaleString("en-IN")}</span>
            )}
          </div>
        )}

        <div className="confirm-modal-actions">
          <button
            type="button"
            className="confirm-cancel-btn"
            onClick={onClose}
            disabled={isDeleting}
          >
            Cancel
          </button>
          <button
            type="button"
            className="confirm-delete-btn"
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmDeleteModal;
