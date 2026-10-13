import React, { useState } from "react";
import CustomStakeModal from "./CustomStakeModal";

const QUICK_STAKES = [1, 5, 10, 25, 50, 100];

export default function StakeChips({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const isCustom = !QUICK_STAKES.includes(value);

  return (
    <>
      <div className="chips">
        {QUICK_STAKES.map((s) => (
          <button
            key={s}
            className={`chips__chip ${value === s ? "is-active" : ""}`}
            onClick={() => onChange(s)}
          >
            ${s}
          </button>
        ))}

        <button
          className={`chips__chip chips__chip--custom ${isCustom ? "is-active" : ""}`}
          onClick={() => setOpen(true)}
        >
          {isCustom ? `$${value}` : "Custom"}
        </button>
      </div>

      <CustomStakeModal
        open={open}
        initial={value}
        onClose={() => setOpen(false)}
        onConfirm={onChange}
      />
    </>
  );
}
