const fs = require('fs');
let content = fs.readFileSync('src/pages/ProfilePage.tsx', 'utf8');

content = content.replace(
    'const [aiProvider, setAiProvider] = useState(user?.aiProvider || "hybrid");',
    'const [aiProvider, setAiProvider] = useState<any>(user?.aiProvider || "hybrid");\n    const [summaryMode, setSummaryMode] = useState<any>((user as any)?.summaryMode || "balanced");'
);

content = content.replace(
    'const profileMutation = useMutation({\n        mutationFn: () => updateProfile({ name, phone, email, aiProvider }),',
    'const profileMutation = useMutation({\n        mutationFn: () => updateProfile({ name, phone, email, aiProvider, summaryMode }),'
);

const toInsert = `{/* AI Preferences */}
                            <div>
                                <p className="text-[9px] uppercase tracking-[0.2em] text-[#CC0000] mb-1.5" style={mono}>AI Preferences</p>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-[9px] uppercase tracking-[0.2em] text-neutral-400 mb-1.5" style={mono}>System Provider</p>
                                        {editMode ? (
                                            <select value={aiProvider} onChange={e => setAiProvider(e.target.value)} className="w-full pb-2 bg-transparent border-b-2 border-[#E5E5E0] focus:border-[#111111] focus:outline-none text-sm text-[#111111]" style={mono}>
                                                <option value="hybrid">System Hybrid (Recommended)</option>
                                                <option value="groq">Groq</option>
                                                <option value="gemini">Gemini</option>
                                            </select>
                                        ) : <p className="text-sm text-[#111111]" style={bodyFont}>{aiProvider}</p>}
                                    </div>
                                    <div>
                                        <p className="text-[9px] uppercase tracking-[0.2em] text-neutral-400 mb-1.5" style={mono}>Summary Detail Level</p>
                                        {editMode ? (
                                            <select value={summaryMode} onChange={e => setSummaryMode(e.target.value)} className="w-full pb-2 bg-transparent border-b-2 border-[#E5E5E0] focus:border-[#111111] focus:outline-none text-sm text-[#111111]" style={mono}>
                                                <option value="concise">Concise</option>
                                                <option value="balanced">Balanced</option>
                                                <option value="detailed">Detailed</option>
                                            </select>
                                        ) : <p className="text-sm text-[#111111] capitalize" style={bodyFont}>{summaryMode}</p>}
                                    </div>
                                </div>
                            </div>
                            `;

content = content.replace('{/* Password */}', toInsert + '{/* Password */}');
fs.writeFileSync('src/pages/ProfilePage.tsx', content);
