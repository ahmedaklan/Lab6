"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

type Member = { id: string; name: string; groupId: string };
type Share = { id: string; memberId: string; amountCents: number; member?: Member };
type Expense = { id: string; description: string; amountCents: number; payerId: string; createdAt: string; payer: Member; participants: Share[] };
type Group = { id: string; name: string; members: Member[]; expenses: Expense[]; balances: { memberId: string; cents: number }[] };
const money = (cents: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Math.abs(cents) / 100);
const initials = (name: string) => name.split(/\s+/).map((part) => part[0]).slice(0, 2).join("").toUpperCase();

export default function Home() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [groupName, setGroupName] = useState("");
  const [memberName, setMemberName] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [payerId, setPayerId] = useState("");
  const [participantIds, setParticipantIds] = useState<string[]>([]);

  const load = useCallback(async (preferredId?: string) => {
    setLoading(true);
    try {
      const response = await fetch("/api/groups", { cache: "no-store" });
      if (!response.ok) throw new Error("Could not load your groups.");
      const data: Group[] = await response.json();
      setGroups(data);
      setSelectedId((current) => preferredId && data.some((group) => group.id === preferredId) ? preferredId : data.some((group) => group.id === current) ? current : data[0]?.id ?? "");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Something went wrong."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const group = groups.find((item) => item.id === selectedId);
  const balanceTotal = useMemo(() => group?.balances.reduce((sum, item) => sum + item.cents, 0) ?? 0, [group]);
  const resetExpense = () => { setDescription(""); setAmount(""); setPayerId(""); setParticipantIds([]); };

  async function submit(event: FormEvent<HTMLFormElement>, url: string, payload: object, onSuccess: (result: Record<string, unknown>) => void) {
    event.preventDefault(); setError(""); setBusy(true);
    try {
      const response = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Could not save this change.");
      onSuccess(result);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Something went wrong."); }
    finally { setBusy(false); }
  }

  return <main className="app-shell">
    <header className="topbar"><a className="brand" href="#"><span className="brand-mark">S</span><span>split<span className="brand-light">smart</span></span></a><div className="topbar-right"><span className="secure-dot" /> Just your group, in sync <span className="avatar self-avatar">Y</span></div></header>
    <div className="workspace">
      <aside className="sidebar">
        <div className="side-label">WORKSPACE</div>
        <div className="workspace-card"><div className="workspace-icon">✳</div><div><strong>Personal space</strong><small>Your shared expenses</small></div><span className="chevron">⌄</span></div>
        <div className="side-label group-label">YOUR GROUPS <span>{groups.length}</span></div>
        <div className="group-list">{groups.map((item) => <button key={item.id} onClick={() => { setSelectedId(item.id); setError(""); }} className={`group-nav ${selectedId === item.id ? "active" : ""}`}><span className="group-symbol">◇</span><span>{item.name}</span><small>{item.members.length}</small></button>)}{groups.length === 0 && !loading && <p className="empty-groups">Your groups will show up here.</p>}</div>
        <form className="new-group" onSubmit={(event) => void submit(event, "/api/groups", { name: groupName }, (result) => { setGroupName(""); void load(String(result.id)); })}><label htmlFor="group-name">Create a group</label><div className="inline-create"><input id="group-name" value={groupName} onChange={(event) => setGroupName(event.target.value)} placeholder="e.g. Cabin weekend" maxLength={60} required /><button aria-label="Create group" disabled={busy}>+</button></div></form>
        <div className="sidebar-footer"><div className="help-mark">?</div><div><strong>Need a hand?</strong><small>Learn how SplitSmart works</small></div><span className="chevron">↗</span></div>
      </aside>

      <section className="main-content">
        {error && <div className="error-banner" role="alert"><span>!</span>{error}<button onClick={() => setError("")} aria-label="Dismiss error">×</button></div>}
        {loading && !group ? <div className="loading-state">Loading your groups…</div> : !group ? <div className="welcome-card"><div className="welcome-illustration">↗</div><p className="eyebrow">A LITTLE LESS AWKWARD</p><h1>Good times, shared fairly.</h1><p>Create a group to start keeping track of shared expenses. We’ll handle the math.</p><div className="welcome-hint">Start with a name in the left sidebar <span>←</span></div></div> : <>
          <div className="page-heading"><div><div className="breadcrumb">YOUR GROUPS <span>/</span> <strong>{group.name.toUpperCase()}</strong></div><h1>{group.name}<button className="heading-menu" aria-label="Group options">···</button></h1><p>{group.members.length} {group.members.length === 1 ? "member" : "members"} <span className="muted-divider">·</span> {group.expenses.length} {group.expenses.length === 1 ? "expense" : "expenses"}</p></div><button className="share-button" onClick={async () => { await navigator.clipboard?.writeText(window.location.href); setError("Group link copied to clipboard."); }}>↗ <span>Share group</span></button></div>
          <div className="summary-grid"><article className="summary-card total-card"><div className="summary-top"><span className="summary-label">TOTAL SPENT</span><span className="summary-icon teal">↗</span></div><strong>{money(group.expenses.reduce((sum, item) => sum + item.amountCents, 0))}</strong><small>Across {group.expenses.length} {group.expenses.length === 1 ? "expense" : "expenses"}</small></article><article className="summary-card people-card"><div className="summary-top"><span className="summary-label">YOUR PEOPLE</span><span className="summary-icon lavender">♧</span></div><strong>{group.members.length} <em>{group.members.length === 1 ? "member" : "members"}</em></strong><small>Sharing the good stuff</small></article><article className="summary-card balance-card"><div className="summary-top"><span className="summary-label">BALANCE CHECK</span><span className="summary-icon mint">✓</span></div><strong className="zero-balance">{balanceTotal === 0 ? "All settled up" : "Needs a look"}</strong><small>{balanceTotal === 0 ? "Everything adds up" : "Balances should net to zero"}</small></article></div>

          <div className="content-grid"><div className="left-column"><section className="panel members-panel"><div className="panel-heading"><div><h2>Your people</h2><p>Everyone in this group</p></div><span className="count-pill">{group.members.length}</span></div><div className="member-list">{group.members.map((member, index) => { const balance = group.balances.find((item) => item.memberId === member.id)?.cents ?? 0; return <div className="member-row" key={member.id}><span className={`avatar avatar-${index % 4}`}>{initials(member.name)}</span><div className="member-info"><strong>{member.name}</strong><small>{member.id === group.members[0]?.id ? "Group member" : "Group member"}</small></div><div className={`member-balance ${balance >= 0 ? "positive" : "negative"}`}>{balance > 0 ? "+" : balance < 0 ? "−" : ""}{money(balance)}</div></div>; })}{group.members.length === 0 && <div className="blank-row">Add your first person to get started.</div>}</div><form className="add-member" onSubmit={(event) => void submit(event, `/api/groups/${group.id}/members`, { name: memberName }, () => { setMemberName(""); void load(group.id); })}><span className="add-plus">+</span><input value={memberName} onChange={(event) => setMemberName(event.target.value)} placeholder="Add someone to the group…" maxLength={60} aria-label="Member name" required /><button disabled={busy}>Add person</button></form></section>

            <section className="panel expenses-panel"><div className="panel-heading"><div><h2>Recent expenses</h2><p>Every little thing, all in one place</p></div><span className="count-pill">{group.expenses.length}</span></div>{group.expenses.length ? <div className="expense-list">{[...group.expenses].reverse().map((expense) => <article className="expense-row" key={expense.id}><span className="expense-icon">↗</span><div className="expense-main"><strong>{expense.description}</strong><small>Paid by {expense.payer.name} <span>·</span> {new Date(expense.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</small><div className="participant-chips">{expense.participants.map((share, index) => <span key={share.id} className={`mini-avatar mini-${index % 4}`} title={share.member?.name}>{initials(share.member?.name ?? "?")}</span>)}<small>Split {expense.participants.length} ways</small></div></div><strong className="expense-amount">{money(expense.amountCents)}</strong></article>)}</div> : <div className="blank-row expense-empty">No expenses yet. Add one below to get the ball rolling.</div>}</section></div>

            <aside className="panel expense-form-panel"><div className="form-title-icon">✳</div><h2>Add an expense</h2><p className="form-intro">Share a cost with your group.</p><form onSubmit={(event) => void submit(event, `/api/groups/${group.id}/expenses`, { description, amount, payerId, participantIds }, () => { resetExpense(); void load(group.id); })}><label htmlFor="description">WHAT WAS IT FOR?</label><input id="description" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="e.g. Dinner, groceries…" maxLength={100} required /><label htmlFor="amount">HOW MUCH?</label><div className="amount-input"><span>$</span><input id="amount" type="number" min="0.01" step="0.01" inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="0.00" required /></div><label htmlFor="payer">WHO PAID?</label><select id="payer" value={payerId} onChange={(event) => setPayerId(event.target.value)} required><option value="" disabled>Select a person</option>{group.members.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}</select><div className="participants-label"><label>WHO WAS INCLUDED?</label><button type="button" onClick={() => setParticipantIds(participantIds.length === group.members.length ? [] : group.members.map((member) => member.id))}>{participantIds.length === group.members.length ? "Clear all" : "Select all"}</button></div><div className="participant-select">{group.members.map((member, index) => <label className="participant-option" key={member.id}><input type="checkbox" checked={participantIds.includes(member.id)} onChange={(event) => setParticipantIds(event.target.checked ? [...participantIds, member.id] : participantIds.filter((id) => id !== member.id))} /><span className={`avatar avatar-${index % 4}`}>{initials(member.name)}</span><span>{member.name}</span><span className="check-box">✓</span></label>)}{group.members.length === 0 && <p className="no-participants">Add group members before recording an expense.</p>}</div><button className="submit-expense" disabled={busy || !group.members.length}>Add expense <span>→</span></button><p className="split-note"><span>✳</span> Split equally, down to the cent.</p></form></aside></div>
        </>}
      </section>
    </div>
  </main>;
}
