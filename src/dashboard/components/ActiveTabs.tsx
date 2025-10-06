import { FaChartLine, FaUserFriends, FaUsers } from "react-icons/fa";
import { useEffect, useRef, useState } from "react";
import type { ActiveTabsProps } from "../../interfaces/ActiveTabs";
import type { Match, Post, Team, TeamWeekStats } from "../../interfaces/Dashboards";
import { format } from 'date-fns';
import { fr as frLocale, enUS as enLocale } from 'date-fns/locale';
import { useActiveTabs } from "../../hooks/useActiveTabs";
import { fetchWeekStats } from "../../services/firebaseService";
import { GenerateSecondPeriodMatchesButton } from "./GenerateSecondPeriodMAtchesButton";
import { RenderMatchCard } from "./RenderCardMatch";
import { DefaultCase } from "./DefaultCase";
import { CreatePost, PostCard } from "./WallComponents";
import { fetchPosts, createPost, likePost, addComment, deletePost } from "../../services/firebaseService";


export const ActiveTabsRenderer = (props: ActiveTabsProps & { t: any }) => {
    const {
        activeTab,
        setSelectedTeam,
        teams,
        selectedTeam,
        currentWeek,
        currentWeekMatches,
        nextWeek,
        prevWeek,
        canEditScore,
        saveMatchResults,
        updateMatchScore,
        user,
        matches,
        setMatches,
        setTeams,
        setActiveTab,
        t
    } = props;

    const [posts, setPosts] = useState<Post[]>([]);
const [postsLoading, setPostsLoading] = useState(true);
    

    const [weekStats, setWeekStats] = useState<TeamWeekStats[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const detailsRef = useRef<HTMLDivElement>(null);

    const { calculateAllPools } = useActiveTabs();
    const { getMatchDateForWeek } = useActiveTabs();

    const [poolATeamsSecondPeriod, setPoolATeamsSecondPeriod] = useState<Team[]>([]);
    const [poolBTeamsSecondPeriod, setPoolBTeamsSecondPeriod] = useState<Team[]>([]);
    const [poolATeamsFirstPeriod, setPoolATeamsFirstPeriod] = useState<Team[]>([]);
    const [poolBTeamsFirstPeriod, setPoolBTeamsFirstPeriod] = useState<Team[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    console.log('User on ActiveTabsRenderer: ', user);

    // Get appropriate date locale
    const dateLocale = t.language === 'fr' ? frLocale : enLocale;

    const handleSelectTeam = (team: Team) => {
        if (selectedTeam?.id === team.id) {
            // delay collapse so animation feels smooth
            setTimeout(() => setSelectedTeam(undefined), 300);
            return;
        }

        // expand new one
        setSelectedTeam(team);

        setTimeout(() => {
            const offset = 220;
            const elementPosition = detailsRef.current?.getBoundingClientRect().top || 0;
            const offsetPosition = elementPosition + window.pageYOffset - offset;

            window.scrollTo({
                top: offsetPosition,
                behavior: "smooth",
            });
        }, 100);
    };

    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            try {

                console.log("Loading pool data for week - useEffect:", currentWeek);
                // Calculate ALL pools at once
                const poolResults = await calculateAllPools(
                    teams ?? [],
                    matches,
                    currentWeek
                );

                console.log("Pool calculation results:", poolResults);

                // Set first period pools
                setPoolATeamsFirstPeriod(poolResults.poolATeams);
                setPoolBTeamsFirstPeriod(poolResults.poolBTeams);

                // Set second period pools  
                setPoolATeamsSecondPeriod(poolResults.premierPool);
                setPoolBTeamsSecondPeriod(poolResults.secondaryPool);

            } catch (error) {
                console.error("Error loading pool data:", error);
                // Reset all pools on error
                setPoolATeamsFirstPeriod([]);
                setPoolBTeamsFirstPeriod([]);
                setPoolATeamsSecondPeriod([]);
                setPoolBTeamsSecondPeriod([]);
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, [activeTab, currentWeek, JSON.stringify(matches.map((m) => m.id))]);

    const isFirstPeriodMatch = (match: Match) => {
        return match.timeSlot === '20:50' || match.timeSlot === '21:10' || match.timeSlot === '21:30';
    };

    const isSecondPeriodMatch = (match: Match) => {
        return match.timeSlot > '21:30';
    };

    console.log('Is first period match function:', isFirstPeriodMatch);
    console.log('Is second period match function:', isSecondPeriodMatch);

    // Load week stats
    useEffect(() => {
        const loadWeekStats = async () => {
            try {
                setLoading(true);
                const stats = await fetchWeekStats(); // Fetch all weeks
                setWeekStats(stats);
            } catch (err) {
                setError(t.errors?.failedToLoadStats || 'Failed to load week statistics');
                console.error('Error loading week stats:', err);
            } finally {
                setLoading(false);
            }
        };

        loadWeekStats();
    }, [t]);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="text-gray-600">{t.loading || 'Loading...'}</div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
                {error}
            </div>
        );
    }

    switch (activeTab) {
        case 'admin':
            return (
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-2xl font-bold text-gray-800 mb-6">{t.adminPanel}</h2>
                    <p className="text-gray-600">{t.adminDescription}</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                        <button
                            type="button"
                            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition"
                            onClick={() => console.log("Create team clicked")}
                        >
                            {t.createTeam}
                        </button>
                        <button
                            type="button"
                            className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition"
                            onClick={() => console.log("Schedule match clicked")}
                        >
                            {t.scheduleMatch}
                        </button>
                    </div>
                </div>
            );

        case 'teams':
            return (
                <div className="min-h-screen bg-gray-50 p-4 lg:p-6">
                    {/* Header Section */}
                    <div className="max-w-7xl mx-auto">
                        <div className="text-center mb-8">
                            <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-3">
                                {t.teams}
                            </h1>
                            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
                                {t.teamsDescription}
                            </p>
                            <div className="mt-4 inline-flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-gray-200 shadow-sm">
                                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                <span className="text-gray-700 font-medium">
                                    {teams?.length || 0} {t.activeTeams}
                                </span>
                            </div>
                        </div>

                        {/* Teams Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            {teams?.map((team) => {
                                const isSelected = selectedTeam?.id === team.id;
                                const totalPlayers = team.players.length;

                                // Calculate total points from weeklyStats
                                const totalPoints = team.weeklyStats?.reduce((total, stats) => total + stats.totalPoints, 0) || 0;

                                // Get current week stats if available
                                const currentWeekStats = team.weeklyStats?.find(stats => stats.week === currentWeek);
                                const currentWeekPoints = currentWeekStats?.totalPoints || 0;

                                return (
                                    <div
                                        key={team.id}
                                        className={`bg-white rounded-xl shadow-sm border-2 transition-all duration-200 cursor-pointer hover:shadow-md ${isSelected
                                            ? 'border-blue-500 shadow-lg'
                                            : 'border-gray-100 hover:border-gray-200'
                                            }`}
                                        onClick={() => handleSelectTeam(team)}
                                    >
                                        {/* Team Header */}
                                        <div className="p-6">
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={`p-2 rounded-lg ${isSelected ? 'bg-blue-100' : 'bg-gray-100'
                                                        }`}>
                                                        <FaUsers className={
                                                            isSelected ? 'text-blue-600' : 'text-gray-600'
                                                        } />
                                                    </div>
                                                    <div>
                                                        <h3 className="font-bold text-gray-900 text-lg">
                                                            {team.name}
                                                        </h3>

                                                    </div>
                                                </div>
                                            </div>

                                            {/* Stats */}
                                            <div className="grid grid-cols-2 gap-3 mb-4">
                                                <div className="text-center p-3 bg-gray-50 rounded-lg">
                                                    <p className="text-2xl font-bold text-green-600">
                                                        {totalPoints}
                                                    </p>
                                                    <p className="text-xs text-gray-600">{t.seasonPoints}</p>
                                                </div>
                                                <div className="text-center p-3 bg-blue-50 rounded-lg">
                                                    <p className="text-xl font-bold text-blue-600">
                                                        {currentWeekPoints}
                                                    </p>
                                                    <p className="text-xs text-gray-600">{t.week}</p>
                                                </div>
                                            </div>

                                            {/* Additional Stats in Expanded View */}
                                            {isSelected && team.weeklyStats && team.weeklyStats.length > 0 && (
                                                <div className="mb-4 p-3 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg border border-gray-200">
                                                    <h5 className="font-semibold text-gray-700 text-sm mb-2">{t.weeklyBreakdown}</h5>
                                                    <div className="space-y-2">
                                                        {team.weeklyStats.slice().reverse().map((stats, _index) => (
                                                            <div key={stats.week} className="flex justify-between items-center text-xs">
                                                                <span className="text-gray-600">{t.week} {stats.week}:</span>
                                                                <div className="flex gap-2">
                                                                    <span className={`px-2 py-1 rounded ${stats.wins > 0 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                                                        {stats.wins}W
                                                                    </span>
                                                                    <span className={`px-2 py-1 rounded ${stats.losses > 0 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>
                                                                        {stats.losses}L
                                                                    </span>
                                                                    <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded">
                                                                        {stats.totalPoints}P
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Players Info */}
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-gray-600">
                                                    {totalPlayers} {totalPlayers !== 1 ? t.players : t.player}
                                                </span>
                                                <div className={`flex items-center gap-1 text-sm ${isSelected ? 'text-blue-600' : 'text-gray-400'
                                                    }`}>
                                                    {isSelected ? t.collapse : t.expand}
                                                    <svg className={`w-4 h-4 transition-transform ${isSelected ? 'rotate-180' : ''
                                                        }`} fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                                    </svg>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Expanded Players Section */}
                                        {isSelected && (
                                            <div
                                                ref={detailsRef}
                                                className="border-t border-gray-100 bg-gray-50 rounded-b-xl p-6 animate-in slide-in-from-bottom-2"
                                                style={{
                                                    maxHeight: isSelected ? "1000px" : "0px",
                                                }}
                                            >
                                                <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                                    <FaUserFriends className="text-blue-500" />
                                                    {t.playerRoster}
                                                </h4>

                                                <div className="space-y-3">
                                                    {team.players.map((player, index) => (
                                                        <div
                                                            key={index}
                                                            className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200"
                                                        >
                                                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                                                                <span className="text-white font-bold text-sm">
                                                                    {index + 1}
                                                                </span>
                                                            </div>
                                                            <div className="flex-1">
                                                                <p className="font-medium text-gray-900">
                                                                    {player}
                                                                </p>
                                                                <p className="text-gray-500 text-sm">
                                                                    {t.player} #{index + 1}
                                                                </p>
                                                            </div>
                                                            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                                                        </div>
                                                    ))}
                                                </div>

                                                {/* Weekly Stats Summary */}
                                                {team.weeklyStats && team.weeklyStats.length > 0 && (
                                                    <div className="mt-6">
                                                        <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                                            <FaChartLine className="text-green-500" />
                                                            {t.seasonPerformance}
                                                        </h4>
                                                        <div className="grid grid-cols-3 gap-2 text-center">
                                                            <div className="bg-white p-3 rounded-lg border border-gray-200">
                                                                <p className="text-2xl font-bold text-green-600">{totalPoints}</p>
                                                                <p className="text-xs text-gray-600">{t.totalPoints}</p>
                                                            </div>
                                                            <div className="bg-white p-3 rounded-lg border border-gray-200">
                                                                <p className="text-xl font-bold text-blue-600">
                                                                    {team.weeklyStats.reduce((total, stats) => total + stats.wins, 0)}
                                                                </p>
                                                                <p className="text-xs text-gray-600">{t.wins}</p>
                                                            </div>
                                                            <div className="bg-white p-3 rounded-lg border border-gray-200">
                                                                <p className="text-xl font-bold text-red-600">
                                                                    {team.weeklyStats.reduce((total, stats) => total + stats.losses, 0)}
                                                                </p>
                                                                <p className="text-xs text-gray-600">{t.losses}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}

                            {/* Empty State */}
                            {(!teams || teams.length === 0) && (
                                <div className="col-span-full">
                                    <div className="text-center py-16">
                                        <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <FaUsers className="text-3xl text-gray-400" />
                                        </div>
                                        <h3 className="text-xl font-bold text-gray-600 mb-2">
                                            {t.noTeamsAvailable}
                                        </h3>
                                        <p className="text-gray-500 max-w-md mx-auto">
                                            {t.teamsWillAppear}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            );
        case 'matches':
            const matchDate = getMatchDateForWeek(currentWeek, '20:50');
            const formattedDate = format(matchDate, "EEEE, MMM d", { locale: dateLocale });

            return (
                <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-800">
                            {t.week} {currentWeek} {t.matches} {formattedDate}
                        </h2>
                        <div className="flex space-x-4">
                            <button
                                type="button"
                                onClick={prevWeek}
                                className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded-lg transition"
                                disabled={currentWeek === 1}
                            >
                                {t.previousWeek}
                            </button>
                            <button
                                type="button"
                                onClick={nextWeek}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
                            >
                                {t.nextWeek}
                            </button>
                        </div>
                    </div>

                    <GenerateSecondPeriodMatchesButton
                        user={user!}
                        currentWeek={currentWeek}
                        teams={teams ?? []}
                        matches={matches}
                        setMatches={setMatches}
                        t={t}
                    />

                    {currentWeekMatches.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            {t.noMatchesScheduled} {currentWeek}
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-800 mb-4">{t.firstPeriod}</h3>
                                <p className="text-sm text-gray-600 mb-4">{t.firstPeriodDescription}</p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {currentWeekMatches
                                        .filter(isFirstPeriodMatch)
                                        .map(match => (
                                            <RenderMatchCard
                                                key={match.id}
                                                match={match}
                                                user={user}
                                                canEditScore={canEditScore}
                                                updateMatchScore={updateMatchScore}
                                                saveMatchResults={saveMatchResults}
                                                matches={matches}
                                                setMatches={setMatches}
                                                teams={teams ? teams : []}
                                                setTeams={setTeams}
                                                t={t}
                                            />
                                        ))
                                    }
                                </div>
                            </div>

                            <div>
                                <h3 className="text-lg font-semibold text-gray-800 mb-4">{t.secondPeriod}</h3>
                                <p className="text-sm text-gray-600 mb-4">
                                    {t.secondPeriodDescription}
                                </p>
                                {currentWeekMatches.filter(isSecondPeriodMatch).length === 0 ? (
                                    <div className="text-center py-8 text-gray-500">
                                        {user!.role === 'admin'
                                            ? t.generateSecondPeriodMatchesAdmin
                                            : t.generateSecondPeriodMatchesUser
                                        }
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {currentWeekMatches
                                            .filter(isSecondPeriodMatch)
                                            .map(match => (
                                                <RenderMatchCard
                                                    key={match.id}
                                                    match={match}
                                                    user={user}
                                                    canEditScore={canEditScore}
                                                    updateMatchScore={updateMatchScore}
                                                    saveMatchResults={saveMatchResults}
                                                    matches={matches}
                                                    setMatches={setMatches}
                                                    teams={teams ? teams : []}
                                                    setTeams={setTeams}
                                                    t={t}
                                                />
                                            ))
                                        }
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            );

        default:
            return (
                <DefaultCase
                    currentWeek={currentWeek}
                    matches={matches}
                    nextWeek={nextWeek}
                    poolATeamsFirstPeriod={poolATeamsFirstPeriod}
                    poolATeamsSecondPeriod={poolATeamsSecondPeriod}
                    poolBTeamsFirstPeriod={poolBTeamsFirstPeriod}
                    poolBTeamsSecondPeriod={poolBTeamsSecondPeriod}
                    prevWeek={prevWeek}
                    setActiveTab={setActiveTab}
                    teams={teams}
                    weekStats={weekStats}
                    t={t}
                />
            );
    }
};