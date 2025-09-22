import { collection, doc, getDocs, updateDoc } from "firebase/firestore";
import { db } from "../services/firebase";

interface Team {
    id: string;
    name: string;
    coach: string;
    players: string[];
    pool: string;
    totalPoints: number;
    currentDayPoints: number;
    secondPeriodPoints?: number;
}

const updateTeamsWithRealPlayers = async () => {
    const teamsData = [
        {
            teamName: "Team 1",
            players: ["Danny Munoz", "Daniela Veas", "Martin Gendron", "Sedki Ayachi", "Xavier Mar", "Zoé Bergeron"]
        },
        {
            teamName: "Team 2",
            players: ["Benjamin fontaine", "Oliver fontaine", "Jules Ludwing", "Fjolla rexhepi", "Justin Quirón", "Amelia Bernet"]
        },
        {
            teamName: "Team 3",
            players: ["Ermina Babajic", "Audrey Lemelin", "Bastien Periard", "Logan Cote", "Justin Lasnier", "Tristan Yoan Beauséjour"]
        },
        {
            teamName: "Team 4",
            players: ["Coralie goulet", "Etienne rainville", "Jonathan lapointe", "William furse", "Lea Linteau", "Jason Boivin"]
        },
        {
            teamName: "Team 5",
            players: ["Emmanuel Bernier", "Odile Big", "Jasmine Richard", "Étienne Guertin", "Daniel de la rosa", "Jules Paquette"]
        },
        {
            teamName: "Team 6",
            players: ["Jan Krolak", "Mélanie Ethier", "William Désilets", "Nohlan Denault", "Émile Bernat", "Christopher Richard"]
        }
    ];

    try {
        // Fetch existing teams from Firestore
        const teamsSnapshot = await getDocs(collection(db, 'teams'));
        const existingTeams: Team[] = teamsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as Team));

        console.log("Found existing teams:", existingTeams.map(t => t.name));

        for (const teamData of teamsData) {
            // Find the corresponding existing team
            const existingTeam = existingTeams.find(t => t.name === teamData.teamName);

            if (existingTeam) {
                // Update the team with real players but keep the existing coach
                await updateDoc(doc(db, 'teams', existingTeam.id), {
                    players: teamData.players,
                    // Keep all other fields as they are (coach, points, etc.)
                });

                console.log(`✓ Updated ${teamData.teamName} with ${teamData.players.length} players`);
                console.log(`  Coach remains: ${existingTeam.coach}`);
                console.log(`  Players: ${teamData.players.join(', ')}`);
            } else {
                console.log(`✗ Team ${teamData.teamName} not found in database`);
            }
        }

        console.log("Team updates completed!");

    } catch (error) {
        console.error("Error updating teams:", error);
    }
};

// Function to display what will be updated (preview)
const previewTeamUpdates = async () => {
    const teamsData = [
        { teamName: "Team 1", players: ["Danny Munoz", "Daniela Veas", "Martin Gendron", "Sedki Ayachi", "Xavier Mar", "Zoé Bergeron"] },
        { teamName: "Team 2", players: ["Benjamin fontaine", "Oliver fontaine", "Jules Ludwing", "Fjolla rexhepi", "Justin Quirón", "Amelia Bernet"] },
        { teamName: "Team 3", players: ["Ermina Babajic", "Audrey Lemelin", "Bastien Periard", "Logan Cote", "Justin Lasnier", "Tristan Yoan Beauséjour"] },
        { teamName: "Team 4", players: ["Coralie goulet", "Etienne rainville", "Jonathan lapointe", "William furse", "Lea Linteau", "Jason Boivin"] },
        { teamName: "Team 5", players: ["Emmanuel Bernier", "Odile Big", "Jasmine Richard", "Étienne Guertin", "Daniel de la rosa", "Jules Paquette"] },
        { teamName: "Team 6", players: ["Jan Krolak", "Mélanie Ethier", "William Désilets", "Nohlan Denault", "Émile Bernat", "Christopher Richard"] }
    ];

    try {
        const teamsSnapshot = await getDocs(collection(db, 'teams'));
        const existingTeams: Team[] = teamsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as Team));

        console.log("=== TEAM UPDATE PREVIEW ===");

        teamsData.forEach(teamData => {
            const existingTeam = existingTeams.find(t => t.name === teamData.teamName);

            if (existingTeam) {
                console.log(`
Team: ${teamData.teamName}
ID: ${existingTeam.id}
Current Coach: ${existingTeam.coach}
Current Players: ${existingTeam.players?.join(', ') || 'None'}
New Players: ${teamData.players.join(', ')}
---- WILL BE UPDATED ----
                `);
            } else {
                console.log(`
Team: ${teamData.teamName}
--- NOT FOUND IN DATABASE ---
                `);
            }
        });

    } catch (error) {
        console.error("Error previewing updates:", error);
    }
};

// One-time execution function
export const initializeTeams = async () => {
    console.log("Updating teams with real player data...");

    // First, preview what will be updated
    await previewTeamUpdates();

    // Ask for confirmation (optional)
    const confirmed = confirm("Proceed with updating teams?");
    if (!confirmed) {
        console.log("Update cancelled.");
        return;
    }

    // Then perform the actual update
    await updateTeamsWithRealPlayers();
};

// Run this to see what will be updated (safe preview)
previewTeamUpdates();

// Uncomment and run this to actually update the teams:
// initializeTeams();