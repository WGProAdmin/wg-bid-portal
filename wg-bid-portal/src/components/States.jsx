import { AlertCircle, Inbox } from 'lucide-react';

export function Loading({ label }) {
  return <div className="state" role="status"><div className="spinner" /><p>{label}</p></div>;
}

export function Empty({ title, body }) {
  return <div className="state"><Inbox size={36} aria-hidden="true" /><h3>{title}</h3><p>{body}</p></div>;
}

export function Notice({ children }) {
  return <div className="notice" role="alert"><AlertCircle size={18} aria-hidden="true" /><div>{children}</div></div>;
}

export function FieldError({ children }) {
  return children ? <div className="field-error" role="alert"><AlertCircle size={14} aria-hidden="true" />{children}</div> : null;
}
