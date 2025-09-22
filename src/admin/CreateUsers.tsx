import { addDoc, collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import { db } from "../services/firebase";

interface TeamUser {
    email: string;
    name: string;
    password: string;
    player: string;
    role: string;
    team: string;
}

const createTeamUsers = (): TeamUser[] => {
    const teamsData = [
        {
            team: "Team 1",
            players: [
                "Danny Munoz",
                "Daniela Veas",
                "Martin Gendron",
                "Sedki Ayachi",
                "Xavier Mar",
                "Zoé Bergeron"
            ]
        },
        {
            team: "Team 2",
            players: [
                "Benjamin fontaine",
                "Oliver fontaine",
                "Jules Ludwing",
                "Fjolla rexhepi",
                "Justin Quirón",
                "Amelia Bernet"
            ]
        },
        {
            team: "Team 3",
            players: [
                "Ermina Babajic",
                "Audrey Lemelin",
                "Bastien Periard",
                "Logan Cote",
                "Justin Lasnier",
                "Tristan Yoan Beauséjour"
            ]
        },
        {
            team: "Team 4",
            players: [
                "Coralie goulet",
                "Etienne rainville",
                "Jonathan lapointe",
                "William furse",
                "Lea Linteau",
                "Jason Boivin"
            ]
        },
        {
            team: "Team 5",
            players: [
                "Emmanuel Bernier",
                "Odile Big",
                "Jasmine Richard",
                "Étienne Guertin",
                "Daniel de la rosa",
                "Jules Paquette"
            ]
        },
        {
            team: "Team 6",
            players: [
                "Jan Krolak",
                "Mélanie Ethier",
                "William Désilets",
                "Nohlan Denault",
                "Émile Bernat",
                "Christopher Richard"
            ]
        }
    ];

    const users: TeamUser[] = [];

    teamsData.forEach(teamData => {
        teamData.players.forEach((playerName) => {
            // Create email: firstname.lastname@league.com (lowercase, no accents, no spaces)
            const emailName = playerName
                .toLowerCase()
                .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Remove accents
                .replace(/\s+/g, '.') // Replace spaces with dots
                .replace(/[^a-z.]/g, ''); // Remove special characters

            // Create password: playerName + 123 (without spaces)
            const password = playerName.replace(/\s+/g, '') + '123';

            // Determine role: Only Danny and Daniela are admin, others are players
            const isDanny = playerName.toLowerCase().includes('danny');
            const isDaniela = playerName.toLowerCase().includes('daniela');
            const role = (isDanny || isDaniela) ? 'admin' : 'player';

            const user: TeamUser = {
                email: `${emailName}@league.com`,
                name: playerName.split(' ')[0], // First name only
                password: password,
                player: playerName,
                role: role,
                team: teamData.team
            };

            users.push(user);
        });
    });

    return users;
};

// Clean up duplicate users
const cleanupDuplicateUsers = async (): Promise<number> => {
    console.log("Checking for duplicate users...");

    try {
        const usersSnapshot = await getDocs(collection(db, "users"));
        const users = usersSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as TeamUser & { id: string }));

        // Group users by email to find duplicates
        const usersByEmail = new Map<string, (TeamUser & { id: string })[]>();

        users.forEach(user => {
            if (!usersByEmail.has(user.email)) {
                usersByEmail.set(user.email, []);
            }
            usersByEmail.get(user.email)!.push(user);
        });

        let deletedCount = 0;

        // Delete duplicates (keep the first one)
        for (const [email, userGroup] of usersByEmail) {
            if (userGroup.length > 1) {
                console.log(`Found ${userGroup.length} duplicates for ${email}`);

                // Keep the first user, delete the rest
                const usersToDelete = userGroup.slice(1);

                for (const userToDelete of usersToDelete) {
                    await deleteDoc(doc(db, "users", userToDelete.id));
                    console.log(`🗑️ Deleted duplicate: ${userToDelete.player} (${userToDelete.team})`);
                    deletedCount++;
                }
            }
        }

        if (deletedCount > 0) {
            console.log(`Cleanup complete! Deleted ${deletedCount} duplicate users.`);
        } else {
            console.log("No duplicates found.");
        }

        return deletedCount;

    } catch (error) {
        console.error("Error cleaning up duplicates:", error);
        return 0;
    }
};

// Safe user initialization function
export const initializeUsers = async (): Promise<{ success: boolean; message: string }> => {
    console.log("=== USER INITIALIZATION STARTED ===");

    try {
        // Step 1: Clean up duplicates first
        const deletedCount = await cleanupDuplicateUsers();

        // Step 2: Get current users
        const existingUsersSnapshot = await getDocs(collection(db, "users"));
        const existingUsers = existingUsersSnapshot.docs.map(doc => doc.data() as TeamUser);

        console.log(`Current user count: ${existingUsers.length}`);

        // Step 3: Create target users
        const targetUsers = createTeamUsers();

        // Step 4: Check if initialization is needed
        if (existingUsers.length === targetUsers.length) {
            console.log("User database already up to date. No changes needed.");
            return {
                success: true,
                message: "User database already up to date."
            };
        }

        // Step 5: Add missing users
        const existingEmails = new Set(existingUsers.map(user => user.email));
        let addedCount = 0;

        for (const user of targetUsers) {
            if (!existingEmails.has(user.email)) {
                await addDoc(collection(db, "users"), user);
                console.log(`✓ Added ${user.player} (${user.team}) - ${user.role}`);
                addedCount++;
            }
        }

        console.log("=== USER INITIALIZATION COMPLETE ===");
        console.log(`Deleted duplicates: ${deletedCount}`);
        console.log(`Added new users: ${addedCount}`);
        console.log(`Total users should be: ${targetUsers.length}`);

        // Verify final count
        const finalSnapshot = await getDocs(collection(db, "users"));
        console.log(`Final user count: ${finalSnapshot.size}`);

        return {
            success: true,
            message: `User initialization complete. Added ${addedCount} users, deleted ${deletedCount} duplicates.`
        };

    } catch (error) {
        console.error("Error during user initialization:", error);
        return {
            success: false,
            message: `Initialization failed: ${error}`
        };
    }
};

// Optional: Function to check user database status
export const checkUserDatabaseStatus = async (): Promise<{
    currentCount: number;
    targetCount: number;
    needsUpdate: boolean;
    status: string;
}> => {
    try {
        const existingUsersSnapshot = await getDocs(collection(db, "users"));
        const currentCount = existingUsersSnapshot.size;
        const targetCount = createTeamUsers().length;
        const needsUpdate = currentCount !== targetCount;

        return {
            currentCount,
            targetCount,
            needsUpdate,
            status: needsUpdate ? `Needs update (${currentCount}/${targetCount} users)` : "Up to date"
        };
    } catch (error) {
        console.error("Error checking database status:", error);
        return {
            currentCount: 0,
            targetCount: 0,
            needsUpdate: false,
            status: "Error checking status"
        };
    }
};