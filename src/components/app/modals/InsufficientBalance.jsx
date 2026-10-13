import React from "react";
import { LuX, LuSmartphone, LuCreditCard, LuArrowUpRight, LuTriangleAlert } from "react-icons/lu";

export default function InsufficientBalance({ open, onClose, onDeposit }) {
  if (!open) return null;

  return (
    <div className="modal" onClick={onClose}>
      <div className="modal__panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal__head">
          <div>
            <h3 className="modal__title modal__title--danger">Insufficient Balance</h3>
            <p className="modal__sub">Top up now to continue trading</p>
          </div>
          <button className="modal__close" onClick={onClose} aria-label="Close"><LuX /></button>
        </div>

        <div className="alert alert--danger">
          <LuTriangleAlert /> Insufficient balance. Top up now!
        </div>

        <div className="paylist">
          <button className="paylist__row" onClick={onDeposit}>
            <span className="paylist__icon paylist__icon--blue"><LuSmartphone /></span>
            <div>
              <strong>M-Pesa</strong>
              <em>Instant mobile money</em>
            </div>
            <LuArrowUpRight className="paylist__arrow" />
          </button>

          <button className="paylist__row" onClick={onDeposit}>
            <span className="paylist__icon paylist__icon--green">
              <span className="paylist__usdt">₮</span>
            </span>
            <div>
              <strong>USDT (TRC20)</strong>
              <em>Cryptocurrency · auto-credited</em>
            </div>
            <LuArrowUpRight className="paylist__arrow" />
          </button>

          <button className="paylist__row" onClick={onDeposit}>
            <span className="paylist__icon paylist__icon--blue"><LuCreditCard /></span>
            <div>
              <strong>Card</strong>
              <em>Visa, Mastercard</em>
            </div>
            <LuArrowUpRight className="paylist__arrow" />
          </button>
        </div>

        <div className="modal__trust">
          <span><i className="dot dot--blue" /> Secure</span>
          <span><i className="dot dot--blue" /> Instant</span>
          <span><i className="dot dot--blue" /> 24/7 Support</span>
        </div>
      </div>
    </div>
  );
}
