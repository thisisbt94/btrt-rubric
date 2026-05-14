import { useState } from "react";

const VALUES = [
  { id: "honesty", label: "Honesty", icon: "◈", color: "#C8973A", desc: "Integrity, transparency, and trustworthiness in all actions" },
  { id: "hardwork", label: "Hard Work", icon: "◆", color: "#2E6FD9", desc: "Dedication, diligence, and going above and beyond" },
  { id: "moral", label: "Moral Responsibility", icon: "◉", color: "#2D9E6B", desc: "Ethical conduct, accountability, and principled decisions" },
  { id: "togetherness", label: "Togetherness", icon: "◎", color: "#9B4FCC", desc: "Collaboration, unity, and lifting others up" },
  { id: "vitality", label: "Vitality", icon: "◈", color: "#D94F2E", desc: "Energy, innovation, and bringing life to every endeavour" },
];

const CRITERIA = [
  {
    id: "excellence",
    title: "Excellence in Output",
    value: "Hard Work",
    valueColor: "#2E6FD9",
    weight: 20,
    description: "Quality, consistency, and measurable impact of work delivered throughout the year.",
    indicators: [
      "Delivers work that sets a benchmark for quality",
      "Consistently meets or exceeds targets and KPIs",
      "Output creates visible impact on business or team goals",
      "Takes ownership from start to finish without prompting",
    ],
  },
  {
    id: "integrity",
    title: "Integrity & Transparency",
    value: "Honesty",
    valueColor: "#C8973A",
    weight: 20,
    description: "Demonstrates consistent honesty, transparency, and ethical conduct in all situations.",
    indicators: [
      "Communicates openly even when it's uncomfortable",
      "Takes responsibility for mistakes without deflecting",
      "Builds trust through consistent, reliable behaviour",
      "Does the right thing even when no one is watching",
    ],
  },
  {
    id: "collaboration",
    title: "Collaboration & Unity",
    value: "Togetherness",
    valueColor: "#9B4FCC",
    weight: 20,
    description: "Actively builds bridges across teams, departments, and geographies within YTL Group.",
    indicators: [
      "Goes beyond their team to support others",
      "Creates an environment where peers feel valued",
      "Shares knowledge, credit, and resources generously",
      "Strengthens team cohesion during high-pressure moments",
    ],
  },
  {
    id: "responsibility",
    title: "Moral Responsibility",
    value: "Moral Responsibility",
    valueColor: "#2D9E6B",
    weight: 20,
    description: "Acts with principled accountability — to the organisation, community, and environment.",
    indicators: [
      "Demonstrates ethical judgment in complex situations",
      "Champions responsible practices (sustainability, inclusion, fairness)",
      "Considers impact on stakeholders beyond immediate task",
      "Leads by example in upholding YTL Group standards",
    ],
  },
  {
    id: "vitality",
    title: "Vitality & Innovation",
    value: "Vitality",
    valueColor: "#D94F2E",
    weight: 20,
    description: "Brings energy, fresh thinking, and initiative that pushes YTL Group forward.",
    indicators: [
      "Proactively identifies problems and drives solutions",
      "Brings new ideas that improve processes or outcomes",
      "Energises others through enthusiasm and commitment",
      "Adapts positively and fast to change and new challenges",
    ],
  },
];

const JUDGE_PANELS = [
  { role: "Peers", weight: 25, icon: "◎", description: "Same-level colleagues who observe day-to-day behaviour, collaboration style, and cultural contribution." },
  { role: "HOD / Team Lead", weight: 35, icon: "◆", description: "Direct managers who assess output quality, reliability, growth trajectory, and professional conduct." },
  { role: "Directors & Senior Leadership", weight: 25, icon: "◈", description: "Senior leaders evaluating strategic contribution, values embodiment, and leadership potential." },
  { role: "HR Panel", weight: 15, icon: "◉", description: "HR representatives ensuring fairness, eligibility, and alignment with YTL Group policies." },
];

const SCALE = [
  { score: "9–10", label: "Exceptional", desc: "Visibly sets the standard. A benchmark for others across YTL Group.", bg: "#0D1F0D", accent: "#2D9E6B" },
  { score: "7–8", label: "Strong", desc: "Consistently exceeds expectations. Recognised impact beyond their role.", bg: "#0D1728", accent: "#2E6FD9" },
  { score: "5–6", label: "Meets Expectations", desc: "Solid, reliable performance. Delivers well within their scope.", bg: "#1A1628", accent: "#9B4FCC" },
  { score: "3–4", label: "Developing", desc: "Some evidence present but inconsistent. Room for growth.", bg: "#1F1A0D", accent: "#C8973A" },
  { score: "1–2", label: "Below Expectations", desc: "Limited evidence this cycle. Significant development needed.", bg: "#1F0D0D", accent: "#D94F2E" },
];

export default function App() {
  const [activeTab, setActiveTab] = useState("criteria");
  const [expandedCriteria, setExpandedCriteria] = useState(null);
  const [scores, setScores] = useState({});

  const toggleCriteria = (id) => setExpandedCriteria(expandedCriteria === id ? null : id);

  const totalScore = Object.values(scores).reduce((sum, s) => sum + (s || 0), 0);
  const maxScore = CRITERIA.reduce((sum, c) => sum + c.weight * 10, 0);
  const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;

  const getScoreLabel = (pct) => {
    if (pct >= 90) return { label: "Exceptional Nominee", color: "#2D9E6B" };
    if (pct >= 75) return { label: "Strong Contender", color: "#2E6FD9" };
    if (pct >= 60) return { label: "Solid Nominee", color: "#9B4FCC" };
    if (pct >= 40) return { label: "Developing", color: "#C8973A" };
    return { label: "Below Threshold", color: "#D94F2E" };
  };

  const result = getScoreLabel(percentage);

  return (
    <div style={{
      minHeight: "100vh",
      background: "#080C14",
      fontFamily: "'Georgia', 'Times New Roman', serif",
      color: "#E8DFC8",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Background texture */}
      <div style={{
        position: "fixed", inset: 0, zIndex: 0,
        background: "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(200,151,58,0.08) 0%, transparent 60%), radial-gradient(ellipse 60% 40% at 80% 80%, rgba(46,111,217,0.06) 0%, transparent 50%)",
        pointerEvents: "none",
      }} />

      <div style={{ position: "relative", zIndex: 1, maxWidth: 900, margin: "0 auto", padding: "0 24px 80px" }}>

        {/* Header */}
        <header style={{ textAlign: "center", paddingTop: 64, paddingBottom: 48 }}>
          <div style={{
            display: "inline-block",
            border: "1px solid rgba(200,151,58,0.3)",
            borderRadius: 2,
            padding: "6px 20px",
            fontSize: 11,
            letterSpacing: "0.3em",
            color: "#C8973A",
            marginBottom: 24,
            textTransform: "uppercase",
          }}>
            YTL Group · Annual Recognition Programme
          </div>
          <h1 style={{
            fontSize: "clamp(42px, 8vw, 72px)",
            fontWeight: 400,
            margin: "0 0 8px",
            lineHeight: 1,
            letterSpacing: "-0.02em",
            color: "#F0E6CC",
          }}>
            BTRT Awards
          </h1>
          <div style={{
            width: 60, height: 2,
            background: "linear-gradient(90deg, transparent, #C8973A, transparent)",
            margin: "20px auto",
          }} />
          <p style={{
            fontSize: 15,
            color: "rgba(232,223,200,0.5)",
            letterSpacing: "0.05em",
            maxWidth: 480,
            margin: "0 auto",
            lineHeight: 1.7,
            fontStyle: "italic",
          }}>
            Recognising the best of YTL Group — across honesty, hard work,<br />moral responsibility, togetherness, and vitality.
          </p>
        </header>

        {/* Core Values Strip */}
        <div style={{
          display: "flex", gap: 8, marginBottom: 48,
          overflowX: "auto", paddingBottom: 4,
        }}>
          {VALUES.map(v => (
            <div key={v.id} style={{
              flex: "1 0 140px",
              border: `1px solid ${v.color}30`,
              borderRadius: 4,
              padding: "16px 14px",
              background: `${v.color}08`,
              textAlign: "center",
            }}>
              <div style={{ fontSize: 18, color: v.color, marginBottom: 6 }}>{v.icon}</div>
              <div style={{ fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", color: v.color, marginBottom: 4 }}>{v.label}</div>
              <div style={{ fontSize: 11, color: "rgba(232,223,200,0.4)", lineHeight: 1.5 }}>{v.desc}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 2, marginBottom: 32, borderBottom: "1px solid rgba(200,151,58,0.15)" }}>
          {[
            { id: "criteria", label: "Judging Criteria" },
            { id: "panels", label: "Judge Panels" },
            { id: "scale", label: "Scoring Scale" },
            { id: "calculator", label: "Score Calculator" },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
              background: "none", border: "none", cursor: "pointer",
              padding: "12px 20px",
              fontSize: 12, letterSpacing: "0.1em", textTransform: "uppercase",
              color: activeTab === tab.id ? "#C8973A" : "rgba(232,223,200,0.4)",
              borderBottom: activeTab === tab.id ? "2px solid #C8973A" : "2px solid transparent",
              marginBottom: -1,
              transition: "all 0.2s",
              fontFamily: "inherit",
            }}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* TAB: Criteria */}
        {activeTab === "criteria" && (
          <div>
            <p style={{ fontSize: 13, color: "rgba(232,223,200,0.45)", marginBottom: 28, letterSpacing: "0.03em" }}>
              Five criteria — each carrying equal weight — anchored to YTL Group's five core values. Every criterion is scored 1–10 by each judge panel.
            </p>
            {CRITERIA.map((c, i) => (
              <div key={c.id} style={{
                border: "1px solid rgba(232,223,200,0.1)",
                borderRadius: 4,
                marginBottom: 12,
                overflow: "hidden",
                background: expandedCriteria === c.id ? "rgba(255,255,255,0.03)" : "transparent",
                transition: "background 0.2s",
              }}>
                <button onClick={() => toggleCriteria(c.id)} style={{
                  width: "100%", background: "none", border: "none", cursor: "pointer",
                  padding: "20px 24px",
                  display: "flex", alignItems: "center", gap: 16,
                  textAlign: "left", fontFamily: "inherit",
                }}>
                  <span style={{
                    fontSize: 11, color: "rgba(232,223,200,0.3)",
                    letterSpacing: "0.1em", minWidth: 24,
                  }}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span style={{ flex: 1 }}>
                    <span style={{ fontSize: 16, color: "#F0E6CC", display: "block", marginBottom: 4 }}>{c.title}</span>
                    <span style={{
                      fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase",
                      color: c.valueColor, opacity: 0.8,
                    }}>
                      Core Value: {c.value}
                    </span>
                  </span>
                  <span style={{
                    fontSize: 11, color: "#C8973A",
                    border: "1px solid rgba(200,151,58,0.3)",
                    borderRadius: 2, padding: "3px 10px",
                    letterSpacing: "0.1em",
                  }}>
                    {c.weight}%
                  </span>
                  <span style={{ color: "rgba(232,223,200,0.3)", fontSize: 14, marginLeft: 8 }}>
                    {expandedCriteria === c.id ? "−" : "+"}
                  </span>
                </button>
                {expandedCriteria === c.id && (
                  <div style={{ padding: "0 24px 24px 64px", borderTop: "1px solid rgba(232,223,200,0.06)" }}>
                    <p style={{ fontSize: 14, color: "rgba(232,223,200,0.6)", lineHeight: 1.7, margin: "16px 0 20px", fontStyle: "italic" }}>
                      {c.description}
                    </p>
                    <div style={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(232,223,200,0.3)", marginBottom: 12 }}>
                      What judges look for
                    </div>
                    {c.indicators.map((ind, j) => (
                      <div key={j} style={{
                        display: "flex", gap: 12, alignItems: "flex-start",
                        marginBottom: 10,
                      }}>
                        <span style={{ color: c.valueColor, fontSize: 8, marginTop: 5, flexShrink: 0 }}>◆</span>
                        <span style={{ fontSize: 13, color: "rgba(232,223,200,0.7)", lineHeight: 1.6 }}>{ind}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* TAB: Judge Panels */}
        {activeTab === "panels" && (
          <div>
            <p style={{ fontSize: 13, color: "rgba(232,223,200,0.45)", marginBottom: 28, letterSpacing: "0.03em" }}>
              Four judge panels with weighted voting rights. Combined, they produce a single composite score per nominee.
            </p>
            <div style={{
              display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16, marginBottom: 40,
            }}>
              {JUDGE_PANELS.map((p) => (
                <div key={p.role} style={{
                  border: "1px solid rgba(232,223,200,0.1)",
                  borderRadius: 4, padding: "24px",
                  background: "rgba(255,255,255,0.02)",
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                    <div>
                      <div style={{ fontSize: 11, color: "rgba(232,223,200,0.3)", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 6 }}>{p.icon}</div>
                      <div style={{ fontSize: 16, color: "#F0E6CC" }}>{p.role}</div>
                    </div>
                    <div style={{
                      fontSize: 28, fontWeight: 300, color: "#C8973A",
                      lineHeight: 1,
                    }}>{p.weight}<span style={{ fontSize: 14 }}>%</span></div>
                  </div>
                  <p style={{ fontSize: 13, color: "rgba(232,223,200,0.5)", lineHeight: 1.7, margin: 0 }}>{p.description}</p>
                </div>
              ))}
            </div>

            {/* Visual weight bar */}
            <div style={{ marginTop: 8 }}>
              <div style={{ fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(232,223,200,0.3)", marginBottom: 12 }}>
                Composite Weight Distribution
              </div>
              <div style={{ display: "flex", height: 8, borderRadius: 4, overflow: "hidden", gap: 2 }}>
                {JUDGE_PANELS.map((p, i) => {
                  const colors = ["#C8973A", "#2E6FD9", "#9B4FCC", "#2D9E6B"];
                  return (
                    <div key={p.role} style={{
                      width: `${p.weight}%`, height: "100%",
                      background: colors[i], borderRadius: 2,
                    }} />
                  );
                })}
              </div>
              <div style={{ display: "flex", gap: 16, marginTop: 10, flexWrap: "wrap" }}>
                {JUDGE_PANELS.map((p, i) => {
                  const colors = ["#C8973A", "#2E6FD9", "#9B4FCC", "#2D9E6B"];
                  return (
                    <div key={p.role} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: colors[i], flexShrink: 0 }} />
                      <span style={{ fontSize: 11, color: "rgba(232,223,200,0.5)" }}>{p.role} ({p.weight}%)</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* How scoring works */}
            <div style={{
              marginTop: 40, border: "1px solid rgba(200,151,58,0.2)",
              borderRadius: 4, padding: 28,
              background: "rgba(200,151,58,0.04)",
            }}>
              <div style={{ fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: "#C8973A", marginBottom: 16 }}>
                How the Final Score is Calculated
              </div>
              <div style={{ fontSize: 13, color: "rgba(232,223,200,0.6)", lineHeight: 2 }}>
                Each judge panel scores a nominee across all 5 criteria (1–10 each).<br />
                Their panel score is multiplied by the panel's weight.<br />
                All weighted panel scores are summed to produce the <span style={{ color: "#F0E6CC" }}>Final Composite Score</span>.<br />
                The nominee with the highest composite score in each category wins.
              </div>
            </div>
          </div>
        )}

        {/* TAB: Scale */}
        {activeTab === "scale" && (
          <div>
            <p style={{ fontSize: 13, color: "rgba(232,223,200,0.45)", marginBottom: 28, letterSpacing: "0.03em" }}>
              Every criterion is rated on a 1–10 scale. Use these descriptors to anchor your scores consistently across all judge panels.
            </p>
            {SCALE.map((s) => (
              <div key={s.score} style={{
                display: "flex", gap: 24, alignItems: "center",
                border: "1px solid rgba(232,223,200,0.08)",
                borderLeft: `3px solid ${s.accent}`,
                borderRadius: "0 4px 4px 0",
                padding: "20px 24px",
                marginBottom: 10,
                background: `${s.bg}80`,
              }}>
                <div style={{
                  fontSize: 24, fontWeight: 300, color: s.accent,
                  minWidth: 50, lineHeight: 1,
                }}>{s.score}</div>
                <div>
                  <div style={{ fontSize: 14, color: "#F0E6CC", marginBottom: 4 }}>{s.label}</div>
                  <div style={{ fontSize: 13, color: "rgba(232,223,200,0.5)", lineHeight: 1.6 }}>{s.desc}</div>
                </div>
              </div>
            ))}
            <div style={{
              marginTop: 32, padding: 24,
              border: "1px solid rgba(232,223,200,0.08)",
              borderRadius: 4,
              background: "rgba(255,255,255,0.02)",
            }}>
              <div style={{ fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(232,223,200,0.3)", marginBottom: 12 }}>
                Scoring Formula (per criterion)
              </div>
              <div style={{
                fontFamily: "monospace", fontSize: 13,
                color: "#C8973A", letterSpacing: "0.05em",
                lineHeight: 2,
              }}>
                Criterion Score = Raw Score (1–10) × Criterion Weight (%)<br />
                Final Score = Σ All Criterion Scores × Judge Panel Weight (%)<br />
                Max Possible = 1,000 points
              </div>
            </div>
          </div>
        )}

        {/* TAB: Calculator */}
        {activeTab === "calculator" && (
          <div>
            <p style={{ fontSize: 13, color: "rgba(232,223,200,0.45)", marginBottom: 28, letterSpacing: "0.03em" }}>
              Use this to calculate a nominee's score. Rate each criterion from 1 to 10.
            </p>
            {CRITERIA.map((c) => (
              <div key={c.id} style={{
                display: "flex", alignItems: "center", gap: 20,
                padding: "18px 0",
                borderBottom: "1px solid rgba(232,223,200,0.07)",
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, color: "#F0E6CC", marginBottom: 3 }}>{c.title}</div>
                  <div style={{ fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: c.valueColor }}>{c.value} · {c.weight}% weight</div>
                </div>
                <div style={{ display: "flex", gap: 4 }}>
                  {[1,2,3,4,5,6,7,8,9,10].map(n => (
                    <button key={n} onClick={() => setScores(s => ({ ...s, [c.id]: n }))} style={{
                      width: 28, height: 28,
                      border: scores[c.id] === n ? `1px solid ${c.valueColor}` : "1px solid rgba(232,223,200,0.15)",
                      borderRadius: 2,
                      background: scores[c.id] === n ? `${c.valueColor}25` : "transparent",
                      color: scores[c.id] === n ? c.valueColor : "rgba(232,223,200,0.4)",
                      fontSize: 11, cursor: "pointer",
                      fontFamily: "inherit",
                      transition: "all 0.15s",
                    }}>{n}</button>
                  ))}
                </div>
                <div style={{
                  minWidth: 50, textAlign: "right",
                  fontSize: 13, color: "rgba(232,223,200,0.4)",
                }}>
                  {scores[c.id] ? `${scores[c.id] * c.weight}` : "—"}
                </div>
              </div>
            ))}

            {/* Result */}
            <div style={{
              marginTop: 32, padding: 32,
              border: `1px solid ${Object.keys(scores).length === 5 ? result.color + "40" : "rgba(232,223,200,0.1)"}`,
              borderRadius: 4,
              background: Object.keys(scores).length === 5 ? `${result.color}08` : "rgba(255,255,255,0.02)",
              textAlign: "center",
              transition: "all 0.3s",
            }}>
              {Object.keys(scores).length < 5 ? (
                <div style={{ color: "rgba(232,223,200,0.3)", fontSize: 13, fontStyle: "italic" }}>
                  Score all five criteria to see the result
                </div>
              ) : (
                <>
                  <div style={{ fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(232,223,200,0.3)", marginBottom: 12 }}>
                    Composite Score
                  </div>
                  <div style={{ fontSize: 64, fontWeight: 300, color: result.color, lineHeight: 1, marginBottom: 8 }}>
                    {totalScore}
                    <span style={{ fontSize: 20, color: "rgba(232,223,200,0.3)" }}>/1000</span>
                  </div>
                  <div style={{ fontSize: 18, color: result.color, marginBottom: 8 }}>{result.label}</div>
                  <div style={{ fontSize: 13, color: "rgba(232,223,200,0.4)" }}>{percentage}th percentile equivalent</div>
                  <button onClick={() => setScores({})} style={{
                    marginTop: 24,
                    background: "none", border: "1px solid rgba(232,223,200,0.2)",
                    borderRadius: 2, padding: "8px 24px",
                    color: "rgba(232,223,200,0.5)", fontSize: 11,
                    letterSpacing: "0.15em", textTransform: "uppercase",
                    cursor: "pointer", fontFamily: "inherit",
                  }}>
                    Reset
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <footer style={{
          marginTop: 80, paddingTop: 32,
          borderTop: "1px solid rgba(200,151,58,0.1)",
          textAlign: "center",
        }}>
          <div style={{ fontSize: 10, letterSpacing: "0.3em", textTransform: "uppercase", color: "rgba(232,223,200,0.2)" }}>
            YTL Group · BTRT Awards · Confidential Judging Framework
          </div>
        </footer>
      </div>
    </div>
  );
}
