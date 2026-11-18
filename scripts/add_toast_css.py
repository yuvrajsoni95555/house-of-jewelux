toast_css = """
/* ===================================================================
   HOUSE OF JEWELUX — LUXURY ACQUISITION TOAST
   =================================================================== */
.acquisition-toast {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 1000;
  display: none;
  background: var(--color-warm-ivory);
  border: 1px solid var(--color-antique-gold);
  border-radius: var(--radius-sm);
  box-shadow: 0 12px 36px rgba(35, 28, 22, 0.16);
  padding: 0.85rem 1.25rem;
  font-family: var(--font-sans);
  pointer-events: auto;
}

.acquisition-toast.active {
  display: block;
}

.acquisition-toast .toast-content {
  display: flex;
  align-items: center;
  gap: 0.85rem;
}

.acquisition-toast .toast-gem {
  color: var(--color-antique-gold);
  font-size: 1.1rem;
}

.acquisition-toast .toast-text-wrap {
  display: flex;
  flex-direction: column;
}

.acquisition-toast .toast-title {
  font-size: 0.68rem;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--color-stone-muted);
  font-weight: 600;
}

.acquisition-toast .toast-item-name {
  font-family: var(--font-serif);
  font-size: 0.9rem;
  color: var(--color-charcoal);
  font-weight: 600;
  max-width: 220px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.acquisition-toast .toast-view-btn {
  background: var(--color-charcoal);
  color: var(--color-warm-ivory);
  border: none;
  border-radius: var(--radius-sm);
  padding: 0.45rem 0.85rem;
  font-size: 0.72rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  cursor: pointer;
  transition: background 0.2s ease;
}

.acquisition-toast .toast-view-btn:hover {
  background: var(--color-antique-gold);
}

@media (max-width: 768px) {
  .acquisition-toast {
    bottom: 80px;
    right: 16px;
    left: 16px;
  }
}
"""

with open('style.css', 'a', encoding='utf-8') as f:
    f.write(toast_css)

print("Acquisition toast CSS appended!")
