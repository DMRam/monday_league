// services/firebaseService.ts
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  addDoc,
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
  deleteDoc,
} from "firebase/firestore";
import { db } from "./firebase";
import type { Post } from "../interfaces/Dashboards";

export interface TeamWeekStats {
  id: string;
  teamId: string;
  wins: number;
  losses: number;
  points: number;
  pointPeriodOne: number;
  pointsPeriodTwo: number;
  week: number;
}

export const fetchWeekStats = async (
  weekNumber?: number
): Promise<TeamWeekStats[]> => {
  try {
    let q;
    if (weekNumber) {
      // Fetch specific week
      q = query(
        collection(db, "teamWeekStats"),
        where("week", "==", weekNumber)
      );
    } else {
      // Fetch all weeks, ordered by week
      q = query(collection(db, "teamWeekStats"), orderBy("week", "asc"));
    }

    const querySnapshot = await getDocs(q);
    const weekStats: TeamWeekStats[] = [];

    querySnapshot.forEach((doc) => {
      weekStats.push({
        id: doc.id,
        ...doc.data(),
      } as TeamWeekStats);
    });

    return weekStats;
  } catch (error) {
    console.error("Error fetching week stats:", error);
    throw error;
  }
};

// Firebase service functions for the wall
export const fetchPosts = async (): Promise<Post[]> => {
  const postsRef = collection(db, "posts");
  const q = query(postsRef, orderBy("createdAt", "desc"));
  const querySnapshot = await getDocs(q);

  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt.toDate(),
    updatedAt: doc.data().updatedAt.toDate(),
    comments:
      doc.data().comments?.map((comment: any) => ({
        ...comment,
        createdAt: comment.createdAt.toDate(),
      })) || [],
  })) as Post[];
};

export const createPost = async (post: Omit<Post, "id">): Promise<void> => {
  const postsRef = collection(db, "posts");
  await addDoc(postsRef, {
    ...post,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
};

export const likePost = async (
  postId: string,
  userId: string
): Promise<void> => {
  const postRef = doc(db, "posts", postId);
  const postDoc = await getDoc(postRef);

  if (postDoc.exists()) {
    const post = postDoc.data();
    const likes = post.likes || [];
    const updatedLikes = likes.includes(userId)
      ? likes.filter((id: string) => id !== userId)
      : [...likes, userId];

    await updateDoc(postRef, { likes: updatedLikes });
  }
};

export const addComment = async (
  postId: string,
  comment: Omit<Comment, "id">
): Promise<void> => {
  const postRef = doc(db, "posts", postId);
  const commentId = Date.now().toString(); // Simple ID generation

  await updateDoc(postRef, {
    comments: arrayUnion({
      ...comment,
      id: commentId,
      createdAt: new Date(),
    }),
  });
};

export const deletePost = async (postId: string): Promise<void> => {
  const postRef = doc(db, "posts", postId);
  await deleteDoc(postRef);
};
