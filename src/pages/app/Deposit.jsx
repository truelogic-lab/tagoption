import React, { useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import MethodList from "../../components/app/wallet/MethodList";
import AmountForm from "../../components/app/wallet/AmountForm";

export default function Deposit() {
  const { store } = useOutletContext();
  const navigate = useNavigate();
  const [method, setMethod] = useState(null);
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async ({ amount: value, method: methodLabel, details }) => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 400));
    await store.deposit({ amount: value, method: methodLabel, details });
    setLoading(false);
    navigate("/positions");
  };

  return (
    <div className="page-form">
      <div className="page-form__head">
        <h1 className="page-form__title">Deposit Funds</h1>
        <p className="page-form__lead">Balance: <strong>${store.balance.toFixed(2)}</strong></p>
      </div>

      {!method ? (
        <MethodList mode="deposit" onPick={setMethod} />
      ) : (
        <>
          <button className="page-form__back" onClick={() => setMethod(null)}>← Change method</button>
          <AmountForm
            mode="deposit"
            method={method}
            amount={amount}
            setAmount={setAmount}
            onSubmit={submit}
            loading={loading}
            balance={store.balance}
          />
        </>
      )}
    </div>
  );
}
