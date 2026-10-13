import React, { useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import Filters from "../../components/app/history/Filters";
import TxList from "../../components/app/history/TxList";

const FILTER_MAP = {
  all: null,
  deposit: ["deposit"],
  withdraw: ["withdraw"],
  trade: ["trade-open", "trade-settle"],
};

export default function History() {
  const { store } = useOutletContext();
  const [filter, setFilter] = useState("all");

  const items = useMemo(() => {
    const allow = FILTER_MAP[filter];
    return store.tx
      .filter((t) => !allow || allow.includes(t.type))
      .sort((a, b) => new Date(b.at) - new Date(a.at));
  }, [store.tx, filter]);

  return (
    <div className="history">
      <div className="history__head">
        <h1 className="page-form__title">History</h1>
        <p className="page-form__lead">Every deposit, withdrawal, and settled trade.</p>
      </div>

      <Filters value={filter} onChange={setFilter} />
      <TxList items={items} />
    </div>
  );
}
