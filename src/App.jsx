
import { useState, useEffect } from "react";

import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "./firebase";

// Polyfill for window.storage using Firebase
if (typeof window !== "undefined" && !window.storage) {
  window.storage = {
    get: async (key) => {
      try {
        const docRef = doc(db, "lab-viva-olinda", "current");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          return { value: JSON.stringify(docSnap.data().exps) };
        }
      } catch (e) {
        console.error("Firebase load error:", e);
      }
      return { value: null };
    },
    set: async (key, val) => {
      try {
        const docRef = doc(db, "lab-viva-olinda", "current");
        await setDoc(docRef, { exps: JSON.parse(val) }, { merge: true });
        return true;
      } catch (e) {
        console.error("Firebase save error:", e);
        return false;
      }
    }
  };
}

const T = {
  floresta: "#0A3320", verde: "#1D6E4E", verdeVivo: "#2AB573", menta: "#C8EDD9",
  creme: "#F5F0E8", areia: "#E8DFD0", branco: "#FDFBF8",
  tinta: "#1A1A14", grafite: "#4A4A3E", cinzaCla: "#9E9C8F", borda: "#D5CFC3",
  ouro: "#A06B00", ouroCla: "#FFF0CC", terra: "#8B3A1A", terraCla: "#FAEAE0",
};
const STATUS = {
  avaliacao: { label: "Em avaliação", cor: T.ouro, bg: T.ouroCla },
  inclusao: { label: "Em processo de inclusão", cor: T.verde, bg: T.menta },
  aprovado: { label: "Certificado", cor: T.floresta, bg: T.menta },
  condicional: { label: "Aprovação condicional", cor: T.ouro, bg: T.ouroCla },
  nao_recomendado: { label: "Não recomendado", cor: T.terra, bg: T.terraCla },
};
const PILARES = [
  { n: 1, nome: "Autenticidade", desc: "Única em Olinda, não replicável em outro destino.", tipo: "Eliminatório" },
  { n: 2, nome: "Replicabilidade", desc: "Operada com consistência para grupos variados.", tipo: "Essencial" },
  { n: 3, nome: "Segurança", desc: "Garante a integridade dos visitantes.", tipo: "Eliminatório" },
  { n: 4, nome: "Impacto Narrativo", desc: "O visitante sai com uma história memorável para contar.", tipo: "Essencial" },
  { n: 5, nome: "Identidade de Olinda", desc: "Fortalece o patrimônio e a cultura do sítio histórico.", tipo: "Diferencial" },
];
const PILAR_COR = { Eliminatório: { c: T.terra, bg: T.terraCla }, Essencial: { c: T.floresta, bg: T.menta }, Diferencial: { c: T.grafite, bg: T.areia } };
const DIMS = [
  { id: "d1", num: "D1", nome: "Narrativa e Conteúdo Histórico-Cultural", peso: "Essencial", mult: 1.5, perguntas: ["O mediador domina o conteúdo com profundidade e afeto?", "A narrativa conecta o patrimônio à Olinda contemporânea?", "O conteúdo é exclusivo e intransferível?"] },
  { id: "d2", num: "D2", nome: "Experiência Sensorial e Imersão", peso: "Essencial", mult: 1.5, perguntas: ["Há imersão que ativa múltiplos sentidos?", "Existem elementos únicos que geram surpresa positiva?"] },
  { id: "d3", num: "D3", nome: "Infraestrutura e Segurança", peso: "Essencial", mult: 1.5, perguntas: ["Há sinalização e pontos de apoio adequados?", "A experiência é acessível para diferentes perfis?"] },
  { id: "d4", num: "D4", nome: "Condução e Mediação Humana", peso: "Essencial", mult: 1.5, perguntas: ["O mediador adapta-se ao público e fala os idiomas necessários?", "O ritmo entre atividade, pausa e narrativa é equilibrado?"] },
  { id: "d5", num: "D5", nome: "Diferenciação e Ativação", peso: "Importante", mult: 1.0, perguntas: ["Há participação ativa e conexão com o entorno cultural de Olinda?"] },
  { id: "d6", num: "D6", nome: "Sustentabilidade e Capacidade de Carga", peso: "Importante", mult: 1.0, perguntas: ["Capacidade de carga, manejo ambiental e impacto comunitário estão adequados?"] },
  { id: "d7", num: "D7", nome: "Comunicação e Comercialização", peso: "Complementar", mult: 0.5, perguntas: ["Material de divulgação, precificação e agendamento são adequados?"] },
];
const PESO_COR = { Essencial: { c: T.floresta, bg: T.menta }, Importante: { c: T.ouro, bg: T.ouroCla }, Complementar: { c: T.grafite, bg: T.areia } };

function genCode() { return Math.random().toString(36).substring(2, 8).toUpperCase(); }
function calcNota(avs) {
  if (!avs || avs.length < 3) return null;
  let tP = 0, tN = 0;
  for (const d of DIMS) { let s = 0, c = 0; for (let i = 1; i <= d.perguntas.length; i++) { const vals = avs.map(a => a.notas?.[d.id + "_" + i]).filter(v => v !== undefined); if (vals.length) { s += vals.reduce((a, b) => a + b, 0) / vals.length; c++; } } if (c) { tN += (s / c) * d.mult; tP += d.mult; } }
  return tP > 0 ? +(tN / tP).toFixed(2) : null;
}
function calcNotaAv(notas) {
  let tP = 0, tN = 0;
  for (const d of DIMS) { let s = 0, c = 0; for (let i = 1; i <= d.perguntas.length; i++) { const v = notas?.[d.id + "_" + i]; if (v !== undefined) { s += v; c++; } } if (c) { tN += (s / c) * d.mult; tP += d.mult; } }
  return tP > 0 ? +(tN / tP).toFixed(2) : null;
}

function gerarSintese(exp) {
  const avs = exp.avaliacoes || [];
  if (avs.length < 3) return "";
  const nota = calcNota(avs);
  if (!nota) return "";
  const dimScores = DIMS.map(d => { let tot = 0, cnt = 0; for (let i = 1; i <= d.perguntas.length; i++) { const vals = avs.map(a => a.notas?.[d.id + "_" + i]).filter(v => v !== undefined); if (vals.length) { tot += vals.reduce((a, b) => a + b, 0) / vals.length; cnt++; } } return { d, score: cnt ? +(tot / cnt).toFixed(2) : 0 }; }).filter(x => x.score > 0).sort((a, b) => b.score - a.score);
  const pontos = dimScores.slice(0, 2).map(x => x.d.nome.toLowerCase());
  const obsColetadas = [];
  for (const av of avs) { for (const d of DIMS) { const txt = av.obs?.[d.id]?.trim(); if (txt && txt.length > 20) obsColetadas.push(txt); } }
  const nivel = nota >= 4.5 ? "excelência" : nota >= 4 ? "alto nível de qualidade" : nota >= 3.5 ? "qualidade certificada" : "aprovação condicional";
  let s = `Com nota ${nota.toFixed(1)} atribuída por ${avs.length} curadores independentes do Lab Viva Olinda, esta experiência recebeu reconhecimento de ${nivel}. `;
  if (pontos.length >= 2) s += `Os avaliadores destacaram especialmente a ${pontos[0]} e a ${pontos[1]} como os principais diferenciais da experiência. `;
  if (obsColetadas.length > 0) { const melhor = obsColetadas.sort((a, b) => b.length - a.length)[0]; const frase = melhor[0].toUpperCase() + melhor.slice(1); s += `"${frase.endsWith(".") ? frase : frase + "."}"` ; }
  return s.trim();
}

function Estrelas({ nota, tam = 20 }) {
  if (!nota) return null;
  const c = Math.floor(nota), m = nota - c >= 0.3 && nota - c < 0.8 ? 1 : 0, v = 5 - c - m;
  return <span style={{ display: "inline-flex", alignItems: "center", gap: 2 }}>{Array(c).fill(0).map((_, i) => <span key={"c" + i} style={{ fontSize: tam, color: "#C8860A", lineHeight: 1 }}>★</span>)}{m === 1 && <span style={{ fontSize: tam, color: "#C8860A", opacity: .5, lineHeight: 1 }}>★</span>}{Array(v).fill(0).map((_, i) => <span key={"v" + i} style={{ fontSize: tam, color: T.borda, lineHeight: 1 }}>★</span>)}<span style={{ fontSize: tam * .75, color: T.grafite, marginLeft: 6, fontWeight: 700, fontFamily: "sans-serif" }}>{nota.toFixed(1)}</span></span>;
}
function EstrelaInput({ valor, onChange, tam = 36 }) {
  const [h, setH] = useState(null);
  return <div style={{ display: "flex", gap: 6 }}>{[1, 2, 3, 4, 5].map(n => <button key={n} type="button" onClick={() => onChange(n)} onMouseEnter={() => setH(n)} onMouseLeave={() => setH(null)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, lineHeight: 1, fontSize: tam, color: n <= (h ?? valor ?? 0) ? "#C8860A" : T.borda, transition: "color .12s" }}>★</button>)}</div>;
}
function Pilula({ txt, cor, bg, g }) { return <span style={{ display: "inline-block", background: bg, color: cor, fontSize: g ? 14 : 11, fontWeight: 700, padding: g ? "6px 16px" : "3px 10px", borderRadius: 99, letterSpacing: ".04em", fontFamily: "sans-serif", lineHeight: 1.4 }}>{txt}</span>; }
function Btn({ label, onClick, tipo = "default", full }) {
  const E = { primary: { bg: T.verde, c: "white", b: T.verde }, danger: { bg: T.terraCla, c: T.terra, b: T.terra }, ghost: { bg: "transparent", c: T.grafite, b: T.borda }, active: { bg: T.menta, c: T.floresta, b: T.verde }, default: { bg: T.branco, c: T.grafite, b: T.borda } };
  const e = E[tipo] || E.default;
  return <button onClick={onClick} onMouseEnter={e => e.currentTarget.style.opacity = ".8"} onMouseLeave={e => e.currentTarget.style.opacity = "1"} style={{ background: e.bg, color: e.c, border: `1.5px solid ${e.b}`, borderRadius: 8, padding: "11px 20px", fontSize: 15, cursor: "pointer", fontFamily: "Georgia,serif", fontWeight: 400, whiteSpace: "nowrap", width: full ? "100%" : undefined, lineHeight: 1.3, transition: "opacity .15s" }}>{label}</button>;
}
const IS = { border: `1.5px solid ${T.borda}`, borderRadius: 8, padding: "14px 18px", fontSize: 17, fontFamily: "Georgia,serif", width: "100%", outline: "none", background: T.branco, color: T.tinta, boxSizing: "border-box", lineHeight: 1.5 };
function Acordeao({ titulo, icone, children, aberto }) {
  const [o, setO] = useState(aberto || false);
  return <div style={{ border: `1.5px solid ${T.borda}`, borderRadius: 12, marginBottom: 12, overflow: "hidden", background: T.branco }}><button onClick={() => setO(x => !x)} style={{ width: "100%", background: "none", border: "none", padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", fontFamily: "Georgia,serif", gap: 12, textAlign: "left" }}><div style={{ display: "flex", alignItems: "center", gap: 14 }}><span style={{ fontSize: 22, color: T.verde, lineHeight: 1 }}>{icone}</span><span style={{ fontSize: 18, color: T.tinta, fontWeight: 400 }}>{titulo}</span></div><span style={{ fontSize: 22, color: T.cinzaCla, transition: "transform .2s", transform: o ? "rotate(180deg)" : "none", flexShrink: 0 }}>▾</span></button>{o && <div style={{ padding: "0 24px 28px", borderTop: `1.5px solid ${T.borda}` }}>{children}</div>}</div>;
}

export default function App() {
  const [aba, setAba] = useState("vitrine");
  const [exps, setExps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [codigo, setCodigo] = useState("");
  const [senha, setSenha] = useState("");
  const [adminOk, setAdminOk] = useState(false);
  const PASS = "vivacurador2026";
  useEffect(() => { (async () => { try { const r = await window.storage.get("lvo_v4"); if (r?.value) setExps(JSON.parse(r.value)); } catch { } setLoading(false); })(); }, []);
  async function salvar(lista) { setExps(lista); try { await window.storage.set("lvo_v4", JSON.stringify(lista)); } catch { } }
  const expAtual = codigo.trim() ? exps.find(e => e.code === codigo.trim().toUpperCase()) : null;
  if (loading) return <div style={{ minHeight: 400, display: "flex", alignItems: "center", justifyContent: "center", color: T.cinzaCla, fontFamily: "Georgia,serif", fontSize: 20 }}>Carregando…</div>;
  const ABAS = [{ id: "vitrine", r: "Experiências" }, { id: "criterios", r: "Como avaliamos" }, { id: "avaliar", r: "Avaliar" }, { id: "admin", r: "Admin" }];
  return (
    <div style={{ fontFamily: "Georgia,serif", background: T.creme, minHeight: "100vh", fontSize: 17 }}>
      {/* HEADER */}
      <div style={{ background: T.floresta }}>
        <div style={{ padding: "2.5rem 2rem 2rem", maxWidth: 980, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1.5rem" }}>
          <div>
            <div style={{ fontSize: 11, letterSpacing: ".22em", textTransform: "uppercase", color: "rgba(200,237,217,.65)", marginBottom: 12, fontFamily: "sans-serif" }}>Comitê de Experiências Turísticas · Olinda · UNESCO</div>
            <h1 style={{ fontSize: "clamp(2rem,5vw,3rem)", color: "white", margin: "0 0 10px", fontWeight: 400, lineHeight: 1.1, letterSpacing: "-.01em" }}>Lab Viva Olinda</h1>
            <p style={{ fontSize: 16, color: "rgba(200,237,217,.8)", margin: 0, lineHeight: 1.7, maxWidth: 500 }}>Plataforma de curadoria e certificação de experiências turísticas do Sítio Histórico de Olinda.</p>
          </div>
          <div style={{ background: "rgba(255,255,255,.07)", border: "1.5px solid rgba(200,237,217,.2)", borderRadius: 16, padding: "1.5rem 2rem", textAlign: "center", flexShrink: 0 }}>
            <div style={{ fontSize: 40, color: T.verdeVivo, lineHeight: 1, marginBottom: 8 }}>✦</div>
            <div style={{ fontSize: 11, letterSpacing: ".14em", textTransform: "uppercase", color: "rgba(200,237,217,.8)", fontFamily: "sans-serif", lineHeight: 1.5 }}>Selo de<br />Qualidade</div>
          </div>
        </div>
        {/* Nav */}
        <div style={{ maxWidth: 980, margin: "0 auto", padding: "0 2rem", display: "flex", overflowX: "auto", gap: 0 }}>
          {ABAS.map(a => <button key={a.id} onClick={() => setAba(a.id)} style={{ background: "none", border: "none", borderBottom: aba === a.id ? `3px solid ${T.verdeVivo}` : "3px solid transparent", color: aba === a.id ? "white" : "rgba(255,255,255,.5)", padding: "16px 20px", fontSize: 14, cursor: "pointer", letterSpacing: ".07em", textTransform: "uppercase", fontFamily: "sans-serif", fontWeight: 700, whiteSpace: "nowrap", transition: "all .15s", lineHeight: 1 }}>{a.r}</button>)}
        </div>
      </div>
      {/* CORPO */}
      <div style={{ maxWidth: 980, margin: "0 auto", padding: "3rem 1.5rem 5rem" }}>
        {aba === "vitrine" && <TabVitrine exps={exps} salvar={salvar} />}
        {aba === "criterios" && <TabCriterios />}
        {aba === "avaliar" && <TabAvaliar codigo={codigo} setCodigo={setCodigo} exp={expAtual} exps={exps} salvar={salvar} />}
        {aba === "admin" && <TabAdmin adminOk={adminOk} senha={senha} setSenha={setSenha} onLogin={() => senha === PASS && setAdminOk(true)} exps={exps} salvar={salvar} />}
      </div>
      {/* RODAPÉ */}
      <div style={{ background: T.floresta, padding: "2.5rem 2rem" }}>
        <div style={{ maxWidth: 980, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "2rem" }}>
          <div>
            <div style={{ color: "white", fontSize: 20, marginBottom: 8 }}>Lab Viva Olinda</div>
            <div style={{ fontSize: 14, color: "rgba(200,237,217,.75)", lineHeight: 1.8 }}>Uma iniciativa do{" "}<a href="https://occa.space" target="_blank" rel="noopener noreferrer" style={{ color: T.verdeVivo, fontWeight: 700, textDecoration: "none" }}>OCCA Open Innovation Lab</a>{" "}em parceria com o<br />Comitê de Experiências Turísticas de Olinda</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: "rgba(200,237,217,.45)", letterSpacing: ".1em", textTransform: "uppercase", fontFamily: "sans-serif", marginBottom: 12 }}>Parceiros institucionais</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {["Viva Olinda", "OCCA Lab", "Comitê Turístico", "Patrimônio UNESCO"].map(l => <div key={l} style={{ background: "rgba(255,255,255,.08)", border: "1px solid rgba(255,255,255,.15)", borderRadius: 8, padding: "8px 16px", fontSize: 13, color: "rgba(200,237,217,.85)", fontFamily: "sans-serif" }}>{l}</div>)}
            </div>
          </div>
          <div style={{ textAlign: "right", fontSize: 12, color: "rgba(200,237,217,.45)", fontFamily: "sans-serif" }}>Framework v1.0<br />Sítio Histórico de Olinda · UNESCO</div>
        </div>
      </div>
    </div>
  );
}

function TabVitrine({ exps, salvar }) {
  const cert = exps.filter(e => ["aprovado", "condicional"].includes(e.status));
  const proc = exps.filter(e => !["aprovado", "condicional"].includes(e.status));
  return (
    <div>
      {/* Bloco Selo */}
      <div style={{ background: T.floresta, borderRadius: 20, padding: "2.5rem 3rem", marginBottom: "3rem", display: "grid", gridTemplateColumns: "auto 1fr", gap: "2rem", alignItems: "center" }}>
        <div style={{ fontSize: 64, color: T.verdeVivo, lineHeight: 1, textAlign: "center" }}>✦</div>
        <div>
          <div style={{ fontSize: 11, letterSpacing: ".18em", textTransform: "uppercase", color: "rgba(200,237,217,.65)", fontFamily: "sans-serif", marginBottom: 10 }}>Garantia de qualidade</div>
          <h2 style={{ fontSize: "clamp(1.3rem,2.5vw,1.75rem)", color: "white", margin: "0 0 .85rem", fontWeight: 400, lineHeight: 1.25 }}>Certificação por entidades locais de confiança</h2>
          <p style={{ fontSize: 15, color: "rgba(200,237,217,.8)", margin: "0 0 1.5rem", lineHeight: 1.8 }}>Cada experiência certificada pelo Lab Viva Olinda passou por avaliação rigorosa com múltiplos curadores, metodologia própria e validação de autenticidade, segurança e impacto narrativo genuíno para o visitante.</p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {["Viva Olinda", "OCCA Open Innovation Lab", "Comitê de Turismo", "Patrimônio UNESCO"].map(l => <div key={l} style={{ background: "rgba(255,255,255,.1)", border: "1px solid rgba(255,255,255,.2)", borderRadius: 6, padding: "6px 14px", fontSize: 12, color: "rgba(200,237,217,.9)", fontFamily: "sans-serif" }}>{l}</div>)}
          </div>
        </div>
      </div>
      {cert.length > 0 && <><GrupoTitulo icone="✦" titulo="Experiências certificadas" /><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(310px,1fr))", gap: "1.5rem", marginBottom: "3rem" }}>{cert.map(e => <CartaoExp key={e.id} exp={e} salvar={salvar} todos={exps} />)}</div></>}
      {proc.length > 0 && <><GrupoTitulo icone="◎" titulo="Em processo de avaliação" /><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(310px,1fr))", gap: "1.5rem" }}>{proc.map(e => <CartaoExp key={e.id} exp={e} salvar={salvar} todos={exps} />)}</div></>}
      {exps.length === 0 && <div style={{ textAlign: "center", padding: "5rem 2rem", color: T.cinzaCla }}><div style={{ fontSize: 56, color: T.borda, marginBottom: "1.5rem" }}>✦</div><div style={{ fontSize: 20, color: T.grafite, marginBottom: ".75rem" }}>Nenhuma experiência cadastrada</div><div style={{ fontSize: 15 }}>Use o painel Admin para adicionar a primeira experiência.</div></div>}
    </div>
  );
}
function GrupoTitulo({ icone, titulo }) { return <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: "1.5rem" }}><span style={{ fontSize: 22, color: T.verde }}>{icone}</span><h3 style={{ margin: 0, fontSize: 20, fontWeight: 400, color: T.tinta }}>{titulo}</h3></div>; }
function CartaoExp({ exp, salvar, todos }) {
  const nota = calcNota(exp.avaliacoes || []);
  const st = STATUS[exp.status] || STATUS.avaliacao;
  const nAv = (exp.avaliacoes || []).length;
  const aprovado = ["aprovado", "condicional"].includes(exp.status);
  return (
    <div style={{ background: T.branco, border: `2px solid ${aprovado ? T.verde : T.borda}`, borderRadius: 18, overflow: "hidden", display: "flex", flexDirection: "column", transition: "box-shadow .2s,transform .2s" }} onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 8px 32px rgba(0,0,0,.12)"; e.currentTarget.style.transform = "translateY(-2px)"; }} onMouseLeave={e => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "none"; }}>
      <div style={{ background: aprovado ? T.floresta : T.grafite, padding: "1.5rem 1.75rem" }}>
        {aprovado && <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}><span style={{ color: T.verdeVivo, fontSize: 15 }}>✦</span><span style={{ fontSize: 11, color: "rgba(200,237,217,.8)", letterSpacing: ".1em", textTransform: "uppercase", fontFamily: "sans-serif", fontWeight: 700 }}>Certificado</span></div>}
        <div style={{ fontSize: 11, color: "rgba(255,255,255,.55)", textTransform: "uppercase", letterSpacing: ".1em", fontFamily: "sans-serif", marginBottom: 8 }}>{exp.categoria || "Experiência"}</div>
        <div style={{ fontSize: 19, color: "white", lineHeight: 1.3 }}>{exp.nome}</div>
      </div>
      <div style={{ padding: "1.5rem 1.75rem", flex: 1, display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
          <Pilula txt={st.label} cor={st.cor} bg={st.bg} />
          {nota ? <Estrelas nota={nota} tam={20} /> : <span style={{ fontSize: 13, color: T.cinzaCla, fontFamily: "sans-serif" }}>{nAv}/3 avaliadores</span>}
        </div>
        {exp.descricao && <p style={{ fontSize: 15, color: T.grafite, margin: 0, lineHeight: 1.8 }}>{exp.descricao}</p>}
        {nAv >= 3 && exp.sintese && <div style={{ background: T.creme, borderRadius: 12, padding: "1rem 1.25rem", borderLeft: `4px solid ${T.verde}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}><span style={{ fontSize: 14, color: T.verde }}>✦</span><span style={{ fontSize: 11, color: T.grafite, letterSpacing: ".08em", textTransform: "uppercase", fontFamily: "sans-serif", fontWeight: 700 }}>Síntese curatorial</span></div>
          <p style={{ fontSize: 14, color: T.tinta, margin: 0, lineHeight: 1.8, fontStyle: "italic" }}>{exp.sintese}</p>
        </div>}
        <div>
          <div style={{ fontSize: 11, letterSpacing: ".1em", textTransform: "uppercase", color: T.cinzaCla, fontFamily: "sans-serif", marginBottom: 12 }}>Pilares de recomendação</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {PILARES.map(p => {
              const pc = PILAR_COR[p.tipo]; return (
                <div key={p.n} style={{ display: "grid", gridTemplateColumns: "28px 1fr auto", gap: 10, alignItems: "start" }}>
                  <div style={{ width: 28, height: 28, borderRadius: "50%", background: pc.bg, color: pc.c, fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontFamily: "sans-serif", flexShrink: 0, marginTop: 2 }}>{p.n}</div>
                  <div><span style={{ fontSize: 14, color: T.tinta }}>{p.nome} </span><span style={{ fontSize: 13, color: T.grafite }}>— {p.desc}</span></div>
                  <Pilula txt={p.tipo} cor={pc.c} bg={pc.bg} />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function TabCriterios() {
  return (
    <div>
      <div style={{ marginBottom: "2.5rem" }}>
        <h2 style={{ fontSize: "clamp(1.5rem,3vw,2rem)", color: T.tinta, fontWeight: 400, margin: "0 0 .75rem", lineHeight: 1.2 }}>Entenda o funcionamento dos critérios de avaliação adotados</h2>
        <p style={{ fontSize: 16, color: T.grafite, margin: 0, lineHeight: 1.8, maxWidth: 660 }}>O Lab Viva Olinda utiliza uma metodologia rigorosa com três componentes: 7 dimensões ponderadas, 5 pilares qualitativos e um sistema de pontuação com cortes claros. Explore cada um abaixo.</p>
      </div>
      <Acordeao titulo="Como funciona o processo" icone="○" aberto>
        <div style={{ paddingTop: 24 }}>
          <p style={{ fontSize: 16, color: T.grafite, marginTop: 0, lineHeight: 1.8, marginBottom: "1.5rem" }}>Cada experiência passa por 5 etapas, com no mínimo 3 avaliadores independentes antes de qualquer veredicto.</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(175px,1fr))", gap: 14 }}>
            {[["1", "Proposta submetida", "O produtor apresenta a experiência ao comitê."], ["2", "Código gerado", "Um código único é compartilhado com os avaliadores."], ["3", "Avaliação em campo", "Mínimo 3 avaliadores visitam e pontuam."], ["4", "Nota calculada", "Média ponderada gerada automaticamente."], ["5", "Parecer final", "Veredicto com base na nota e nos 5 pilares."]].map(([n, t, d]) => (
              <div key={n} style={{ background: T.creme, borderRadius: 12, padding: "1.5rem", border: `1.5px solid ${T.borda}` }}>
                <div style={{ fontSize: "2.2rem", color: T.verde, lineHeight: 1, marginBottom: 10 }}>{n}</div>
                <div style={{ fontSize: 15, color: T.tinta, marginBottom: 8, lineHeight: 1.4 }}>{t}</div>
                <div style={{ fontSize: 13, color: T.grafite, lineHeight: 1.7 }}>{d}</div>
              </div>
            ))}
          </div>
        </div>
      </Acordeao>
      <Acordeao titulo="As 7 dimensões avaliadas" icone="◇">
        <div style={{ paddingTop: 20, display: "flex", flexDirection: "column", gap: 12 }}>
          {DIMS.map(d => {
            const pc = PESO_COR[d.peso]; return (
              <div key={d.id} style={{ background: T.creme, borderRadius: 12, padding: "1.25rem 1.5rem", border: `1.5px solid ${T.borda}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 12, flexWrap: "wrap" }}>
                  <div><span style={{ fontSize: 13, color: T.cinzaCla, fontFamily: "sans-serif", marginRight: 8 }}>{d.num}</span><span style={{ fontSize: 16, color: T.tinta }}>{d.nome}</span></div>
                  <div style={{ display: "flex", gap: 6 }}><Pilula txt={d.peso} cor={pc.c} bg={pc.bg} /><Pilula txt={`×${d.mult}`} cor={T.grafite} bg={T.areia} /></div>
                </div>
                {d.perguntas.map((p, i) => <div key={i} style={{ fontSize: 14, color: T.grafite, lineHeight: 1.7, paddingLeft: 18, position: "relative", marginBottom: i < d.perguntas.length - 1 ? 8 : 0 }}><span style={{ position: "absolute", left: 0, color: T.verde, fontSize: 15 }}>→</span>{p}</div>)}
              </div>
            );
          })}
        </div>
      </Acordeao>
      <Acordeao titulo="Sistema de pontuação" icone="◈">
        <div style={{ paddingTop: 20 }}>
          <p style={{ fontSize: 16, color: T.grafite, marginTop: 0, lineHeight: 1.8, marginBottom: "1.5rem" }}>Cada dimensão recebe nota de 1 a 5. A nota final é a média ponderada de no mínimo 3 avaliadores.</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(140px,1fr))", gap: 12, marginBottom: "1.75rem" }}>
            {[[1, "Insatisfatório", "#FAEBE0", "#8B3A1A"], [2, "Insuficiente", "#FFF5DD", "#8B6000"], [3, "Regular", T.ouroCla, T.ouro], [4, "Bom", T.menta, T.floresta], [5, "Excepcional", "#C8EDD9", T.floresta]].map(([n, nome, bg, c]) => (
              <div key={n} style={{ background: bg, borderRadius: 12, padding: "1.25rem", border: `2px solid ${c}30` }}>
                <div style={{ fontSize: "2.2rem", color: c, lineHeight: 1, fontWeight: 400 }}>{n}</div>
                <div style={{ fontSize: 13, color: c, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", fontFamily: "sans-serif", marginTop: 6 }}>{nome}</div>
              </div>
            ))}
          </div>
          <div style={{ background: T.menta, border: `2px solid ${T.verde}`, borderRadius: 14, padding: "1.5rem 2rem" }}>
            <div style={{ fontSize: 16, color: T.floresta, marginBottom: "1.25rem", fontWeight: 400 }}>Pontuações de corte (nota ponderada de 0 a 5)</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, textAlign: "center" }}>
              {[["≥ 3,5", T.floresta, "Aprovado"], ["2,5–3,4", T.ouro, "Condicional"], ["< 2,5", T.terra, "Não recomendado"]].map(([v, c, l]) => (
                <div key={l}><div style={{ fontSize: "1.8rem", color: c }}>{v}</div><div style={{ fontSize: 13, color: T.grafite, fontFamily: "sans-serif", marginTop: 6 }}>{l}</div></div>
              ))}
            </div>
          </div>
        </div>
      </Acordeao>
      <Acordeao titulo="Os 5 pilares qualitativos" icone="✦">
        <div style={{ paddingTop: 20, display: "flex", flexDirection: "column", gap: 12, marginBottom: "1.5rem" }}>
          {PILARES.map(p => {
            const pc = PILAR_COR[p.tipo]; return (
              <div key={p.n} style={{ background: T.creme, borderRadius: 12, padding: "1.25rem 1.5rem", border: `1.5px solid ${T.borda}`, display: "grid", gridTemplateColumns: "48px 1fr auto", gap: 16, alignItems: "center" }}>
                <div style={{ width: 48, height: 48, borderRadius: "50%", background: T.floresta, color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 400, flexShrink: 0 }}>{p.n}</div>
                <div><div style={{ fontSize: 16, color: T.tinta, marginBottom: 6 }}>{p.nome}</div><div style={{ fontSize: 14, color: T.grafite, lineHeight: 1.6 }}>{p.desc}</div></div>
                <Pilula txt={p.tipo} cor={pc.c} bg={pc.bg} />
              </div>
            );
          })}
        </div>
        <div style={{ background: T.branco, border: `1.5px solid ${T.borda}`, borderRadius: 12, overflow: "hidden" }}>
          <div style={{ background: T.areia, display: "grid", gridTemplateColumns: "1fr 1.8fr 1fr", borderBottom: `1px solid ${T.borda}` }}>
            {["Resultado", "Condição", "Prazo"].map(h => <div key={h} style={{ padding: "12px 18px", fontSize: 12, color: T.grafite, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em", fontFamily: "sans-serif" }}>{h}</div>)}
          </div>
          {[["aprovado", "Aprovado", "Nota ≥ 3,5 + eliminatórios confirmados", "Inclusão imediata"], ["condicional", "Condicional", "Nota 2,5–3,4 OU essencial ausente c/ plano", "90 dias"], ["nao_recomendado", "Não recomendado", "Nota < 2,5 OU eliminatório ausente", "Reavaliação em 6 meses"]].map(([k, r, c, p], i) => {
            const s = STATUS[k]; return (
              <div key={k} style={{ display: "grid", gridTemplateColumns: "1fr 1.8fr 1fr", borderBottom: i < 2 ? `1px solid ${T.borda}` : "none" }}>
                <div style={{ padding: "14px 18px" }}><Pilula txt={r} cor={s.cor} bg={s.bg} /></div>
                <div style={{ padding: "14px 18px", fontSize: 14, color: T.grafite, lineHeight: 1.6 }}>{c}</div>
                <div style={{ padding: "14px 18px", fontSize: 14, color: T.tinta }}>{p}</div>
              </div>
            );
          })}
        </div>
      </Acordeao>
    </div>
  );
}

function TabAvaliar({ codigo, setCodigo, exp, exps, salvar }) {
  const [nome, setNome] = useState("");
  const [notas, setNotas] = useState({});
  const [obs, setObs] = useState({});
  const [enviado, setEnviado] = useState(false);
  const [erro, setErro] = useState("");
  const totalQ = DIMS.reduce((a, d) => a + d.perguntas.length, 0);
  const preview = calcNotaAv(notas);
  async function enviar() {
    if (!exp) return;
    if (!nome.trim()) { setErro("Por favor, informe seu nome antes de enviar."); return; }
    if (Object.keys(notas).length < totalQ) { setErro(`Por favor, responda todas as ${totalQ} perguntas.`); return; }
    setErro("");
    const av = { nome: nome.trim(), notas, obs, data: new Date().toLocaleDateString("pt-BR") };
    await salvar(exps.map(e => e.id === exp.id ? { ...e, avaliacoes: [...(e.avaliacoes || []), av], sintese: undefined } : e));
    setEnviado(true);
  }
  if (enviado) return <div style={{ textAlign: "center", padding: "5rem 2rem" }}><div style={{ fontSize: 72, color: T.verde, lineHeight: 1, marginBottom: "1.5rem" }}>✓</div><h2 style={{ fontSize: 26, color: T.tinta, fontWeight: 400, marginBottom: "1rem" }}>Avaliação enviada!</h2><p style={{ fontSize: 17, color: T.grafite }}>Obrigado, {nome}. Sua avaliação foi registrada com sucesso.</p></div>;
  return (
    <div>
      <h2 style={{ fontSize: "clamp(1.4rem,3vw,1.9rem)", color: T.tinta, fontWeight: 400, margin: "0 0 .75rem" }}>Instrumento de Avaliação</h2>
      <p style={{ fontSize: 16, color: T.grafite, margin: "0 0 2rem", lineHeight: 1.7 }}>Insira o código de acesso fornecido pelo comitê para avaliar a experiência.</p>
      <div style={{ background: T.branco, border: `2px solid ${T.borda}`, borderRadius: 14, padding: "1.75rem", marginBottom: "1.5rem" }}>
        <label style={{ fontSize: 16, color: T.grafite, display: "block", marginBottom: 12 }}>Código de acesso da experiência</label>
        <div style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
          <input value={codigo} onChange={e => setCodigo(e.target.value.toUpperCase())} placeholder="Ex: AB12CD"
            style={{ ...IS, width: 200, fontFamily: "monospace", letterSpacing: ".25em", fontSize: 22, textAlign: "center" }} />
          {codigo && !exp && <div style={{ fontSize: 15, color: T.terra, fontFamily: "sans-serif", display: "flex", alignItems: "center", gap: 6 }}><span style={{ fontSize: 20 }}>⚠</span> Código não encontrado</div>}
          {exp && <Pilula txt={exp.nome} cor={T.floresta} bg={T.menta} g />}
        </div>
      </div>
      {exp && <>
        <div style={{ background: T.branco, border: `2px solid ${T.borda}`, borderRadius: 14, padding: "1.75rem", marginBottom: "1.5rem" }}>
          <label style={{ fontSize: 16, color: T.grafite, display: "block", marginBottom: 12 }}>Seu nome completo <span style={{ color: T.terra }}>*</span></label>
          <input value={nome} onChange={e => setNome(e.target.value)} placeholder="Como você quer ser identificado na avaliação" style={IS} />
        </div>
        <div style={{ background: T.ouroCla, border: `2px solid ${T.ouro}30`, borderRadius: 12, padding: "1.25rem 1.5rem", marginBottom: "2rem", display: "flex", gap: 14, alignItems: "flex-start" }}>
          <span style={{ fontSize: 28, color: T.ouro, flexShrink: 0, lineHeight: 1 }}>ℹ</span>
          <p style={{ margin: 0, fontSize: 15, color: "#5C3D00", lineHeight: 1.8 }}>Esta é uma avaliação <strong>multi-avaliador</strong>. A nota final só será calculada com <strong>pelo menos 3 avaliações registradas</strong>. Avaliadores registrados até agora: <strong>{(exp.avaliacoes || []).length} de 3</strong>.</p>
        </div>
        {DIMS.map(d => {
          const pc = PESO_COR[d.peso]; return (
            <div key={d.id} style={{ background: T.branco, border: `2px solid ${T.borda}`, borderRadius: 14, marginBottom: "1.5rem", overflow: "hidden" }}>
              <div style={{ background: T.areia, padding: "1.25rem 1.75rem", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `1.5px solid ${T.borda}`, flexWrap: "wrap", gap: 10 }}>
                <span style={{ fontSize: 16, color: T.tinta }}><span style={{ color: T.cinzaCla, fontFamily: "sans-serif", fontSize: 13, marginRight: 8 }}>{d.num}</span>{d.nome}</span>
                <div style={{ display: "flex", gap: 6 }}><Pilula txt={d.peso} cor={pc.c} bg={pc.bg} /><Pilula txt={`×${d.mult}`} cor={T.grafite} bg={T.areia} /></div>
              </div>
              <div style={{ padding: "1.5rem 1.75rem" }}>
                {d.perguntas.map((p, i) => {
                  const key = d.id + "_" + (i + 1); return (
                    <div key={key} style={{ marginBottom: "1.5rem", paddingBottom: "1.5rem", borderBottom: i < d.perguntas.length - 1 ? `1px solid ${T.borda}` : "none" }}>
                      <p style={{ fontSize: 16, color: T.tinta, margin: "0 0 1rem", lineHeight: 1.7 }}>{p}</p>
                      <EstrelaInput valor={notas[key]} onChange={v => setNotas(n => ({ ...n, [key]: v }))} tam={40} />
                    </div>
                  );
                })}
                <div>
                  <label style={{ fontSize: 14, color: T.cinzaCla, display: "block", marginBottom: 8, fontFamily: "sans-serif" }}>Observações sobre esta dimensão (opcional)</label>
                  <textarea value={obs[d.id] || ""} onChange={e => setObs(o => ({ ...o, [d.id]: e.target.value }))} placeholder="Descreva o que observou…" rows={3} style={{ ...IS, resize: "vertical", minHeight: 80 }} />
                </div>
              </div>
            </div>
          );
        })}
        {preview && <div style={{ background: T.menta, border: `2px solid ${T.verde}`, borderRadius: 14, padding: "1.5rem 1.75rem", marginBottom: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}><span style={{ fontSize: 16, color: T.floresta }}>Sua nota parcial individual</span><Estrelas nota={preview} tam={26} /></div>}
        {erro && <div style={{ background: T.terraCla, border: `2px solid ${T.terra}40`, borderRadius: 10, padding: "1.25rem 1.5rem", marginBottom: "1.5rem", fontSize: 15, color: T.terra }}>{erro}</div>}
        <Btn label="Enviar minha avaliação →" onClick={enviar} tipo="primary" full />
      </>}
    </div>
  );
}

function RelatorioModal({ exp, onClose }) {
  if (!exp) return null;
  const avs = exp.avaliacoes || [];
  const nota = calcNota(avs);
  const st = STATUS[exp.status] || STATUS.avaliacao;
  const hoje = new Date().toLocaleDateString("pt-BR");
  const dimStats = DIMS.map(d => {
    const stats = d.perguntas.map((p, i) => { const key = d.id + "_" + (i + 1); const vals = avs.map(a => a.notas?.[key]).filter(v => v !== undefined); const media = vals.length ? +(vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2) : null; return { p, key, vals, media }; });
    const valid = stats.filter(s => s.media !== null);
    const media = valid.length ? +(valid.reduce((a, s) => a + s.media, 0) / valid.length).toFixed(2) : null;
    const obs = avs.map((av, i) => av.obs?.[d.id]?.trim() ? { nome: av.nome, txt: av.obs[d.id].trim() } : null).filter(Boolean);
    return { d, stats, media, obs };
  });
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(10,30,20,.72)", zIndex: 2000, overflowY: "auto", padding: "2rem 1rem" }}>
      <div style={{ background: T.branco, borderRadius: 20, maxWidth: 780, margin: "0 auto", border: `2px solid ${T.verde}` }}>
        <div style={{ background: T.floresta, borderRadius: "18px 18px 0 0", padding: "2.5rem 2.5rem 2rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
            <div>
              <div style={{ fontSize: 11, letterSpacing: ".2em", textTransform: "uppercase", color: "rgba(200,237,217,.65)", fontFamily: "sans-serif", marginBottom: 10 }}>Relatório Interno de Avaliação · Lab Viva Olinda</div>
              <h2 style={{ fontSize: "clamp(1.3rem,3vw,1.8rem)", color: "white", margin: "0 0 8px", fontWeight: 400 }}>{exp.nome}</h2>
              <p style={{ margin: 0, fontSize: 14, color: "rgba(200,237,217,.7)", fontFamily: "sans-serif" }}>Gerado em {hoje} · {avs.length} avaliador{avs.length !== 1 ? "es" : ""} · Cód. {exp.code}</p>
            </div>
            <button onClick={onClose} style={{ background: "rgba(255,255,255,.1)", border: "1.5px solid rgba(255,255,255,.2)", borderRadius: 10, width: 44, height: 44, cursor: "pointer", fontSize: 20, color: "white", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>✕</button>
          </div>
          {nota && <div style={{ marginTop: "1.5rem", display: "flex", gap: "1.5rem", alignItems: "center", flexWrap: "wrap" }}><Estrelas nota={nota} tam={28} /><Pilula txt={st.label} cor={st.cor} bg={st.bg} g /></div>}
        </div>
        <div style={{ padding: "2rem 2.5rem 2.5rem" }}>
          {dimStats.map(({ d, stats, media, obs: obsD }) => {
            const pc = PESO_COR[d.peso];
            return (
              <div key={d.id} style={{ marginBottom: "2rem", paddingBottom: "2rem", borderBottom: `1.5px solid ${T.borda}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 12, color: T.cinzaCla, fontFamily: "sans-serif" }}>{d.num}</span>
                    <span style={{ fontSize: 16, color: T.tinta }}>{d.nome}</span>
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}><Pilula txt={d.peso} cor={pc.c} bg={pc.bg} /><Pilula txt={`×${d.mult}`} cor={T.grafite} bg={T.areia} />{media && <Estrelas nota={media} tam={18} />}</div>
                </div>
                {stats.map(({ p, vals, media: pMedia }) => (
                  <div key={p} style={{ marginBottom: "1rem", paddingLeft: "1rem", borderLeft: `3px solid ${T.borda}` }}>
                    <p style={{ fontSize: 14, color: T.grafite, margin: "0 0 8px", lineHeight: 1.6 }}>{p}</p>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                      {avs.map((av, i) => (
                        <div key={i} style={{ background: T.creme, borderRadius: 8, padding: "4px 10px", fontSize: 13, color: T.tinta, fontFamily: "sans-serif", display: "flex", gap: 6, alignItems: "center" }}>
                          <span style={{ color: T.cinzaCla }}>{av.nome.split(" ")[0]}</span>
                          <span style={{ color: "#C8860A" }}>{"★".repeat(vals[i] || 0)}</span>
                          <span style={{ fontWeight: 700 }}>{vals[i] ?? "—"}</span>
                        </div>
                      ))}
                      {pMedia && <span style={{ fontSize: 13, color: T.floresta, fontWeight: 700, fontFamily: "sans-serif", marginLeft: 4 }}>Média: {pMedia}</span>}
                    </div>
                  </div>
                ))}
                {obsD.length > 0 && (
                  <div style={{ marginTop: "1rem" }}>
                    <div style={{ fontSize: 11, color: T.cinzaCla, fontFamily: "sans-serif", textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 8 }}>Observações dos avaliadores</div>
                    {obsD.map((o, i) => (
                      <div key={i} style={{ background: T.creme, borderRadius: 10, padding: "12px 16px", marginBottom: 8, borderLeft: `4px solid ${T.verde}` }}>
                        <span style={{ fontSize: 12, color: T.verde, fontFamily: "sans-serif", fontWeight: 700 }}>{o.nome} — </span>
                        <span style={{ fontSize: 14, color: T.tinta, lineHeight: 1.7, fontStyle: "italic" }}>"{o.txt}"</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
          <div style={{ background: nota >= 3.5 ? T.menta : nota >= 2.5 ? T.ouroCla : T.terraCla, border: `2px solid ${nota >= 3.5 ? T.verde : nota >= 2.5 ? T.ouro : T.terra}40`, borderRadius: 14, padding: "1.5rem 2rem" }}>
            <div style={{ fontSize: 16, color: T.tinta, marginBottom: 8 }}>Recomendação do comitê</div>
            <p style={{ margin: 0, fontSize: 15, color: T.grafite, lineHeight: 1.8 }}>
              {nota >= 3.5
                ? `A experiência obteve nota ${nota.toFixed(1)} e está recomendada para certificação pelo Lab Viva Olinda. Os critérios essenciais foram atendidos com consistência.`
                : nota >= 2.5
                ? `A experiência obteve nota ${nota.toFixed(1)} — aprovação condicional. Recomendamos atenção às dimensões com pontuação abaixo de 3 para alcançar a certificação plena dentro do prazo de 90 dias.`
                : `A experiência obteve nota ${nota?.toFixed(1) ?? "—"} e não atingiu o mínimo para certificação neste ciclo. Utilize o detalhamento por dimensão acima para identificar os principais pontos de melhoria antes de uma reavaliação.`}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function TabAdmin({ adminOk, senha, setSenha, onLogin, exps, salvar }) {
  const [vista, setVista] = useState("lista");
  const [editId, setEditId] = useState(null);
  const [editData, setEditData] = useState(null);
  const [modal, setModal] = useState(null);
  const [relatorioId, setRelatorioId] = useState(null);
  const [novo, setNovo] = useState({ nome: "", categoria: "", descricao: "", status: "avaliacao", reavaliacao: "" });
  if (!adminOk) return (
    <div style={{ maxWidth: 440, margin: "5rem auto", textAlign: "center" }}>
      <div style={{ fontSize: 56, color: T.borda, marginBottom: "2rem" }}>⚿</div>
      <h2 style={{ fontSize: 24, fontWeight: 400, color: T.tinta, marginBottom: "1.5rem" }}>Acesso administrativo</h2>
      <input type="password" value={senha} onChange={e => setSenha(e.target.value)} onKeyDown={e => e.key === "Enter" && onLogin()} placeholder="Senha do comitê" style={{ ...IS, marginBottom: 20, textAlign: "center", letterSpacing: ".2em" }} />
      <Btn label="Entrar" onClick={onLogin} tipo="primary" full />
    </div>
  );
  async function criarNovo() { if (!novo.nome.trim()) return; const exp = { ...novo, id: Date.now().toString(), code: genCode(), avaliacoes: [], criadoEm: new Date().toLocaleDateString("pt-BR") }; await salvar([...exps, exp]); setNovo({ nome: "", categoria: "", descricao: "", status: "avaliacao", reavaliacao: "" }); setVista("lista"); }
  async function excluirExp(id) { if (!window.confirm("Excluir esta experiência?")) return; await salvar(exps.filter(e => e.id !== id)); }
  async function excluirAv(expId, avIdx) { if (!window.confirm("Excluir esta avaliação?")) return; await salvar(exps.map(e => e.id === expId ? { ...e, avaliacoes: e.avaliacoes.filter((_, i) => i !== avIdx), sintese: undefined } : e)); setModal(null); }
  async function salvarEd() { await salvar(exps.map(e => e.id === editId ? { ...e, ...editData } : e)); setEditId(null); setEditData(null); }

  // Modal avaliação completa
  const modalEl = (() => {
    if (!modal) return null;
    const exp = exps.find(e => e.id === modal.expId); if (!exp) return null;
    const av = exp.avaliacoes[modal.avIdx]; if (!av) return null;
    const nota = calcNotaAv(av.notas);
    return (
      <div style={{ position: "fixed", inset: 0, background: "rgba(10,30,20,.65)", zIndex: 1000, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "2rem", overflowY: "auto" }}>
        <div style={{ background: T.branco, borderRadius: 18, padding: "2.5rem", maxWidth: 660, width: "100%", marginTop: "1rem", border: `2px solid ${T.verde}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "2rem", paddingBottom: "1.25rem", borderBottom: `2px solid ${T.borda}` }}>
            <div>
              <h3 style={{ margin: "0 0 6px", fontSize: 22, fontWeight: 400, color: T.tinta }}>{av.nome}</h3>
              <p style={{ margin: 0, fontSize: 14, color: T.cinzaCla, fontFamily: "sans-serif" }}>{exp.nome} · {av.data}</p>
            </div>
            <div style={{ display: "flex", gap: 14, alignItems: "center", flexShrink: 0 }}>
              {nota && <Estrelas nota={nota} tam={20} />}
              <button onClick={() => setModal(null)} style={{ background: "none", border: `2px solid ${T.borda}`, borderRadius: 10, width: 44, height: 44, cursor: "pointer", fontSize: 20, color: T.grafite, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
            </div>
          </div>
          {DIMS.map(d => (
            <div key={d.id} style={{ marginBottom: "1.5rem", paddingBottom: "1.5rem", borderBottom: `1px solid ${T.borda}` }}>
              <div style={{ fontSize: 15, color: T.tinta, marginBottom: 12 }}><span style={{ color: T.cinzaCla, fontSize: 12, fontFamily: "sans-serif", marginRight: 8 }}>{d.num}</span>{d.nome}</div>
              {d.perguntas.map((p, i) => {
                const v = av.notas?.[d.id + "_" + (i + 1)]; return (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", gap: 12, borderBottom: i < d.perguntas.length - 1 ? `1px dashed ${T.borda}` : "none" }}>
                    <span style={{ fontSize: 14, color: T.grafite, flex: 1, lineHeight: 1.6 }}>{p}</span>
                    {v ? <Estrelas nota={v} tam={16} /> : <span style={{ fontSize: 13, color: T.borda, fontFamily: "sans-serif" }}>—</span>}
                  </div>
                );
              })}
              {av.obs?.[d.id] && <div style={{ marginTop: 10, background: T.creme, borderRadius: 8, padding: "10px 14px", borderLeft: `4px solid ${T.verde}` }}><p style={{ margin: 0, fontSize: 13, color: T.grafite, lineHeight: 1.7, fontStyle: "italic" }}>"{av.obs[d.id]}"</p></div>}
            </div>
          ))}
          <Btn label="Excluir esta avaliação" onClick={() => excluirAv(modal.expId, modal.avIdx)} tipo="danger" />
        </div>
      </div>
    );
  })();

  const expRelatorio = relatorioId ? exps.find(e => e.id === relatorioId) : null;
  return (
    <div>
      {modalEl}
      <RelatorioModal exp={expRelatorio} onClose={() => setRelatorioId(null)} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
        <h2 style={{ margin: 0, fontSize: 24, fontWeight: 400, color: T.tinta }}>Painel Admin</h2>
        <div style={{ display: "flex", gap: 10 }}><Btn label="Lista" onClick={() => { setVista("lista"); setEditId(null); }} tipo={vista === "lista" ? "active" : "default"} /><Btn label="+ Nova experiência" onClick={() => setVista("nova")} tipo={vista === "nova" ? "active" : "default"} /></div>
      </div>
      {vista === "nova" && <div style={{ background: T.branco, border: `2px solid ${T.borda}`, borderRadius: 16, padding: "2rem", marginBottom: "2.5rem" }}><h3 style={{ margin: "0 0 1.5rem", fontSize: 20, fontWeight: 400, color: T.tinta }}>Nova experiência</h3><FormExp data={novo} setData={setNovo} /><Btn label="Criar e gerar código de acesso →" onClick={criarNovo} tipo="primary" /></div>}
      {vista === "lista" && <div>
        {exps.length === 0 && <div style={{ textAlign: "center", padding: "4rem", color: T.cinzaCla, fontSize: 17 }}>Nenhuma experiência cadastrada.</div>}
        {exps.map(exp => {
          const nota = calcNota(exp.avaliacoes || []); const st = STATUS[exp.status] || STATUS.avaliacao; const isEd = editId === exp.id; const nAv = (exp.avaliacoes || []).length;
          return (
            <div key={exp.id} style={{ background: T.branco, border: `2px solid ${T.borda}`, borderRadius: 16, marginBottom: "1.5rem", overflow: "hidden" }}>
              <div style={{ padding: "1.5rem 1.75rem", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 14, flexWrap: "wrap", borderBottom: `1.5px solid ${T.borda}` }}>
                <div style={{ flex: 1, minWidth: 220 }}>
                  <div style={{ fontSize: 18, color: T.tinta, marginBottom: 10 }}>{exp.nome}</div>
                  <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                    <Pilula txt={st.label} cor={st.cor} bg={st.bg} />
                    <span style={{ fontSize: 14, fontFamily: "monospace", background: T.menta, border: `1.5px solid ${T.verde}30`, color: T.floresta, padding: "4px 12px", borderRadius: 8, letterSpacing: ".18em", fontWeight: 700 }}>🔑 {exp.code}</span>
                    {nota && <Estrelas nota={nota} tam={17} />}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", flexShrink: 0 }}>
                  <Btn label={isEd ? "Cancelar" : "Editar"} onClick={() => { if (isEd) { setEditId(null); setEditData(null); } else { setEditId(exp.id); setEditData({ nome: exp.nome, categoria: exp.categoria, descricao: exp.descricao, status: exp.status, reavaliacao: exp.reavaliacao, sintese: exp.sintese }); } }} />
                  {isEd && <Btn label="Salvar" onClick={salvarEd} tipo="primary" />}
                  {nAv >= 3 && <Btn label="📄 Relatório" onClick={() => setRelatorioId(exp.id)} tipo="ghost" />}
                  {nAv >= 3 && <Btn label="✦ Gerar síntese pública" onClick={async () => { const s = gerarSintese(exp); await salvar(exps.map(e => e.id === exp.id ? { ...e, sintese: s } : e)); }} tipo="ghost" />}
                  <Btn label="Excluir" onClick={() => excluirExp(exp.id)} tipo="danger" />
                </div>
              </div>
              {isEd && <div style={{ padding: "1.5rem 1.75rem", background: T.creme, borderBottom: `1.5px solid ${T.borda}` }}><FormExp data={editData} setData={setEditData} /></div>}
              <div style={{ padding: "1.25rem 1.75rem" }}>
                <div style={{ fontSize: 13, textTransform: "uppercase", letterSpacing: ".1em", color: T.cinzaCla, fontFamily: "sans-serif", marginBottom: 12 }}>Avaliadores ({nAv}){nAv < 3 && <span style={{ color: T.ouro, marginLeft: 10 }}>— mínimo 3 para nota final</span>}</div>
                {nAv === 0 && <p style={{ fontSize: 15, color: T.cinzaCla, margin: 0, fontStyle: "italic" }}>Nenhuma avaliação registrada ainda.</p>}
                {exp.avaliacoes.map((av, i) => {
                  const an = calcNotaAv(av.notas); return (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: i < nAv - 1 ? `1px solid ${T.borda}` : "none", gap: 14, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 16, color: T.tinta, flex: 1 }}>{av.nome}</span>
                      <span style={{ fontSize: 13, color: T.cinzaCla, fontFamily: "sans-serif" }}>{av.data}</span>
                      {an && <Estrelas nota={an} tam={15} />}
                      <Btn label="Ver avaliação completa" onClick={() => setModal({ expId: exp.id, avIdx: i })} />
                    </div>
                  );
                })}
                {nota && <div style={{ marginTop: 14, paddingTop: 14, borderTop: `2px solid ${T.verde}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}><span style={{ fontSize: 16, color: T.tinta }}>Nota final ponderada</span><Estrelas nota={nota} tam={22} /></div>}
                {exp.sintese && <div style={{ marginTop: 14, background: T.creme, borderRadius: 10, padding: "12px 16px", borderLeft: `4px solid ${T.verde}` }}><div style={{ fontSize: 11, color: T.cinzaCla, fontFamily: "sans-serif", marginBottom: 6, letterSpacing: ".08em", textTransform: "uppercase" }}>Síntese curatorial</div><p style={{ margin: 0, fontSize: 14, color: T.grafite, lineHeight: 1.7, fontStyle: "italic" }}>"{exp.sintese}"</p></div>}
              </div>
            </div>
          );
        })}
      </div>}
    </div>
  );
}
function FormExp({ data, setData }) {
  const f = (k, v) => setData(d => ({ ...d, [k]: v }));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <input value={data.nome || ""} onChange={e => f("nome", e.target.value)} placeholder="Nome da experiência *" style={IS} />
      <input value={data.categoria || ""} onChange={e => f("categoria", e.target.value)} placeholder="Categoria (ex: Ecoturismo, Gastronomia, Culture)" style={IS} />
      <textarea value={data.descricao || ""} onChange={e => f("descricao", e.target.value)} placeholder="Descrição curta da experiência" rows={3} style={{ ...IS, resize: "vertical" }} />
      <textarea value={data.sintese || ""} onChange={e => f("sintese", e.target.value)} placeholder="Síntese curatorial (Manual)" rows={3} style={{ ...IS, resize: "vertical" }} />
      <div><label style={{ fontSize: 14, color: T.grafite, display: "block", marginBottom: 8, fontFamily: "sans-serif" }}>Status</label><select value={data.status || "avaliacao"} onChange={e => f("status", e.target.value)} style={IS}>{Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select></div>
      {data.status === "nao_recomendado" && <input value={data.reavaliacao || ""} onChange={e => f("reavaliacao", e.target.value)} placeholder="Prazo de reavaliação (ex: Outubro 2026)" style={IS} />}
    </div>
  );
}
