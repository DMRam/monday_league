import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    FaVolleyballBall, FaUsers, FaUser, FaLock, FaEye, FaEyeSlash,
    FaCalendarAlt, FaChartBar, FaGlobe, FaTimes, FaInfoCircle
} from "react-icons/fa";
import { collection, query, where, getDocs, addDoc, getDoc } from "firebase/firestore";
import { db } from "../services/firebase";
import type { TeamUser } from "../interfaces/User";
import { useAuth } from '../contexts/AuthContext';
import { normalizeString } from '../utils/stringUtils';
import { useLanguage } from '../contexts/LanguageContext'; // Import the language context

interface LoginSession {
    userId: string;
    teamName: string;
    playerName: string;
    role: string;
    loginTime: any;
    logoutTime?: any;
    isActive: boolean;
    ipAddress?: string;
    userAgent?: string;
}

export const Login = () => {
    const { language, setLanguage, t } = useLanguage(); // Use the language context
    const { login } = useAuth();
    const navigate = useNavigate();

    const [teamName, setTeamName] = useState("");
    const [playerName, setPlayerName] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState<{ team?: string; player?: string; password?: string }>({});
    const [shake, setShake] = useState(false);
    const [showAdminModal, setShowAdminModal] = useState(false);

    // Load remembered credentials
    useEffect(() => {
        const remembered = localStorage.getItem("rememberedCredentials");
        if (remembered) {
            const { team, player } = JSON.parse(remembered);
            setTeamName(team);
            setPlayerName(player);
            setRememberMe(true);
        }
    }, []);

    const validateForm = () => {
        const newErrors: { team?: string; player?: string; password?: string } = {};

        if (!teamName.trim()) newErrors.team = `${t.team} ${language === 'en' ? 'is required' : 'est requis'}`;
        if (!playerName.trim()) newErrors.player = `${t.player} ${language === 'en' ? 'is required' : 'est requis'}`;
        if (!password) newErrors.password = `${t.password} ${language === 'en' ? 'is required' : 'est requis'}`;
        else if (password.length < 6)
            newErrors.password = language === 'en'
                ? 'Password must be at least 6 characters'
                : 'Le mot de passe doit contenir au moins 6 caractères';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) {
            setShake(true);
            return;
        }

        setIsLoading(true);

        try {
            // Normalize all inputs consistently
            const normalizedPassword = normalizeString(password);
            const normalizedTeamName = normalizeString(teamName, { capitalize: true });
            const normalizedPlayerName = normalizeString(playerName, { capitalize: true });

            console.log("Querying with:", {
                team: normalizedTeamName,
                player: normalizedPlayerName,
                password: normalizedPassword
            });

            const userQuery = query(
                collection(db, "users"),
                where("team", "==", normalizedTeamName),
                where("player", "==", normalizedPlayerName)
            );

            const snapshot = await getDocs(userQuery);

            console.log("Query results:", snapshot.size, "documents found");

            if (snapshot.empty) {
                console.log("No user found with these credentials");
                throw new Error("Invalid credentials");
            }

            const userDoc = snapshot.docs[0];
            const docData = userDoc.data() as TeamUser;

            console.log("User found:", docData);

            // Normalize the stored password for comparison
            const storedPasswordNormalized = normalizeString(docData.password);

            // Compare normalized passwords
            if (storedPasswordNormalized !== normalizedPassword) {
                console.log("Password mismatch");
                console.log("Expected:", storedPasswordNormalized);
                console.log("Received:", normalizedPassword);
                throw new Error("Invalid credentials");
            }

            // Build login session
            const loginSession: Omit<LoginSession, "id"> = {
                userId: userDoc.id,
                teamName: docData.team,
                playerName: docData.player,
                role: docData.role,
                loginTime: new Date().toISOString(),
                isActive: true,
            };

            const sessionRef = await addDoc(collection(db, "loginSessions"), loginSession);

            const newSessionDoc = await getDoc(sessionRef);
            console.log("Session created:", newSessionDoc.exists(), newSessionDoc.data());

            // Save session info locally
            const sessionData = {
                userId: userDoc.id,
                sessionId: sessionRef.id,
                userData: docData,
                loginTime: Date.now(),
            };
            localStorage.setItem("session", JSON.stringify(sessionData));

            // Remember credentials if requested - use normalized names
            if (rememberMe) {
                localStorage.setItem(
                    "rememberedCredentials",
                    JSON.stringify({ team: normalizedTeamName, player: normalizedPlayerName })
                );
            } else {
                localStorage.removeItem("rememberedCredentials");
            }

            // Use auth context
            login(docData);

            // Role-based navigation
            navigate("/dashboard", { state: { user: docData, language } });
        } catch (err) {
            console.error("Login error:", err);
            setErrors({ team: t.invalid, player: t.invalid, password: t.invalid });
            setShake(true);
            setTimeout(() => setShake(false), 500);
        } finally {
            setIsLoading(false);
        }
    };

    const toggleLanguage = () => {
        const newLang = language === 'en' ? 'fr' : 'en';
        setLanguage(newLang);
    };

    const handleForgotPassword = () => setShowAdminModal(true);

    return (
        <>
            <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 flex items-center justify-center p-4 md:p-8">
                {/* Login card */}
                <div className={`bg-white rounded-2xl shadow-2xl flex flex-col md:flex-row w-full max-w-5xl transform transition-transform duration-300 ${shake ? 'shake-animation' : ''}`}>
                    {/* Left side - Form */}
                    <div className="w-full md:w-3/5 p-5 md:p-8 lg:p-10">
                        <div className="flex justify-between items-center mb-4">
                            <div className="flex items-center">
                                <FaVolleyballBall className="text-orange-500 text-2xl md:text-3xl mr-2" />
                                <h1 className="text-xl md:text-2xl font-bold text-gray-800">{t.title}</h1>
                            </div>

                            <button
                                onClick={toggleLanguage}
                                className="flex items-center space-x-1 text-gray-600 hover:text-blue-600 transition-colors px-2 py-1 rounded-full border border-gray-200 hover:border-blue-300 text-sm"
                                aria-label="Change language"
                            >
                                <FaGlobe className="text-xs" />
                                <span className="font-medium">{language === 'en' ? 'FR' : 'EN'}</span>
                            </button>
                        </div>

                        <p className="text-gray-600 mb-6 text-sm md:text-base">{t.subtitle}</p>

                        <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
                            {/* Team Name */}
                            <div>
                                <div className="relative">
                                    <div className="absolute left-3 top-3 text-gray-400">
                                        <FaUsers />
                                    </div>
                                    <input
                                        type="text"
                                        className={`pl-10 w-full px-4 py-3 border ${errors.team ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition`}
                                        placeholder={t.team}
                                        value={teamName}
                                        onChange={(e) => {
                                            setTeamName(e.target.value);
                                            if (errors.team) setErrors({ ...errors, team: undefined });
                                        }}
                                        onBlur={(e) => {
                                            setTeamName(normalizeString(e.target.value, { capitalize: true }));
                                        }}
                                    />
                                </div>
                                {errors.team && <p className="text-red-500 text-xs mt-1">{errors.team}</p>}
                            </div>

                            {/* Player Name */}
                            <div>
                                <div className="relative">
                                    <div className="absolute left-3 top-3 text-gray-400">
                                        <FaUser />
                                    </div>
                                    <input
                                        type="text"
                                        className={`pl-10 w-full px-4 py-3 border ${errors.player ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition`}
                                        placeholder={t.player}
                                        value={playerName}
                                        onChange={(e) => {
                                            setPlayerName(e.target.value);
                                            if (errors.player) setErrors({ ...errors, player: undefined });
                                        }}
                                        onBlur={(e) => {
                                            setPlayerName(normalizeString(e.target.value, { capitalize: true }));
                                        }}
                                    />
                                </div>
                                {errors.player && <p className="text-red-500 text-xs mt-1">{errors.player}</p>}
                            </div>

                            {/* Password */}
                            <div>
                                <div className="relative">
                                    <div className="absolute left-3 top-3 text-gray-400">
                                        <FaLock />
                                    </div>
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        className={`pl-10 pr-10 w-full px-4 py-3 border ${errors.password ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition`}
                                        placeholder={t.password}
                                        value={password}
                                        onChange={(e) => {
                                            setPassword(e.target.value);
                                            if (errors.password) setErrors({ ...errors, password: undefined });
                                        }}
                                    />
                                    <button
                                        type="button"
                                        className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                                        onClick={() => setShowPassword(!showPassword)}
                                        aria-label={showPassword ? t.hidePassword : t.showPassword}
                                    >
                                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                                    </button>
                                </div>
                                {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
                            </div>

                            {/* Options */}
                            <div className="flex justify-between items-center">
                                <label className="flex items-center space-x-2 text-sm text-gray-600 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={rememberMe}
                                        onChange={(e) => setRememberMe(e.target.checked)}
                                        className="rounded text-blue-600 focus:ring-blue-500"
                                    />
                                    <span>{t.rememberMe}</span>
                                </label>

                                <button
                                    type="button"
                                    className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
                                    onClick={handleForgotPassword}
                                >
                                    {t.forgotPassword}
                                </button>
                            </div>

                            <div className="relative flex items-center justify-center">
                                <div className="flex-grow border-t border-transparent"></div>
                                <span className="flex-shrink mx-4 text-transparent text-sm">{t.or}</span>
                                <div className="flex-grow border-t border-transparent"></div>
                            </div>

                            {/* Submit */}
                            <button
                                type="submit"
                                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-4 rounded-lg hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all flex items-center justify-center shadow-md hover:shadow-lg"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        {t.loading}
                                    </>
                                ) : (
                                    t.signin
                                )}
                            </button>
                        </form>
                    </div>

                    {/* Right side - Info / graphics */}
                    <div className="w-full md:w-2/5 bg-gradient-to-br from-blue-700 to-blue-900 text-white rounded-b-2xl md:rounded-none md:rounded-r-2xl p-8 flex flex-col items-center justify-center relative overflow-hidden">
                        {/* Decorative elements */}
                        <div className="absolute -top-20 -right-20 w-40 h-40 rounded-full bg-blue-600 opacity-20"></div>
                        <div className="absolute -bottom-20 -left-20 w-40 h-40 rounded-full bg-blue-600 opacity-20"></div>

                        <div className="relative mb-6 z-10">
                            <div className="absolute -inset-4 bg-blue-600 rounded-full opacity-30 animate-ping"></div>
                            <div className="absolute -inset-2 bg-blue-500 rounded-full opacity-20"></div>
                            <FaVolleyballBall className="text-5xl md:text-6xl text-orange-400 relative animate-bounce" style={{ animationDuration: '2s' }} />
                        </div>

                        <h2 className="text-xl md:text-2xl font-bold mb-4 text-center z-10">{t.welcome}</h2>
                        <p className="text-center text-blue-100 mb-6 text-sm md:text-base z-10">{t.description}</p>

                        <h3 className="text-lg font-semibold mb-4 self-start z-10">{t.features}</h3>

                        <div className="space-y-4 w-full text-sm z-10">
                            <div className="flex items-center bg-blue-600/30 backdrop-blur-sm p-3 rounded-lg">
                                <div className="bg-white/20 p-2 rounded-full mr-3">
                                    <FaUser className="w-4 h-4 text-white" />
                                </div>
                                <span>{t.playerMgmt}</span>
                            </div>

                            <div className="flex items-center bg-blue-600/30 backdrop-blur-sm p-3 rounded-lg">
                                <div className="bg-white/20 p-2 rounded-full mr-3">
                                    <FaCalendarAlt className="w-4 h-4 text-white" />
                                </div>
                                <span>{t.schedule}</span>
                            </div>

                            <div className="flex items-center bg-blue-600/30 backdrop-blur-sm p-3 rounded-lg">
                                <div className="bg-white/20 p-2 rounded-full mr-3">
                                    <FaChartBar className="w-4 h-4 text-white" />
                                </div>
                                <span>{t.stats}</span>
                            </div>
                        </div>

                        {/* Animated volleyballs in background */}
                        <div className="absolute bottom-0 left-0 w-full flex justify-between px-6 opacity-10">
                            <FaVolleyballBall className="text-4xl animate-bounce" style={{ animationDelay: '0.5s', animationDuration: '3s' }} />
                            <FaVolleyballBall className="text-4xl animate-bounce" style={{ animationDelay: '1s', animationDuration: '4s' }} />
                            <FaVolleyballBall className="text-4xl animate-bounce" style={{ animationDelay: '1.5s', animationDuration: '5s' }} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Admin Contact Modal */}
            {showAdminModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 relative">
                        <button onClick={() => setShowAdminModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                            <FaTimes className="text-xl" />
                        </button>
                        <div className="flex items-center mb-4">
                            <div className="bg-blue-100 p-3 rounded-full mr-3">
                                <FaInfoCircle className="text-blue-600 text-xl" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-800">{t.adminContact}</h3>
                        </div>
                        <p className="text-gray-600 mb-2">{t.supportMessage}</p>
                        <div className="bg-blue-50 p-4 rounded-lg mt-4">
                            <p className="text-blue-800 font-medium">{t.contactAdmin}</p>
                            <div className="mt-3 flex flex-col space-y-2">
                                <div className="flex items-center">
                                    <span className="text-blue-700 font-medium mr-2">Email:</span>
                                    <span className="text-blue-600">admin@volleyleague.example</span>
                                </div>
                                <div className="flex items-center">
                                    <span className="text-blue-700 font-medium mr-2">Phone:</span>
                                    <span className="text-blue-600">(555) 123-4567</span>
                                </div>
                            </div>
                        </div>
                        <button onClick={() => setShowAdminModal(false)} className="w-full mt-6 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">
                            {language === 'en' ? 'Close' : 'Fermer'}
                        </button>
                    </div>
                </div>
            )}

            <style>{`
                .shake-animation {
                    animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
                }
                @keyframes shake {
                    10%, 90% { transform: translate3d(-1px, 0, 0); }
                    20%, 80% { transform: translate3d(2px, 0, 0); }
                    30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
                    40%, 60% { transform: translate3d(4px, 0, 0); }
                }
            `}</style>
        </>
    );
};