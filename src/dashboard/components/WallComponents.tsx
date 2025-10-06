import { useState } from "react";
import { FaHeart, FaRegHeart, FaComment, FaShare, FaEllipsisH } from "react-icons/fa";
import type { Post } from "../../interfaces/Dashboards";
import type { User } from "firebase/auth";

interface PostCardProps {
    post: Post;
    user: User | null;
    onLike: (postId: string) => void;
    onComment: (postId: string, comment: string) => void;
    onDelete?: (postId: string) => void;
    t: any;
}

export const PostCard = ({ post, user, onLike, onComment, onDelete, t }: PostCardProps) => {
    const [showComments, setShowComments] = useState(false);
    const [newComment, setNewComment] = useState("");
    const [isLiked, setIsLiked] = useState(user ? post.likes.includes(user.uid) : false);

    const handleLike = () => {
        if (!user) return;
        setIsLiked(!isLiked);
        onLike(post.id);
    };

    const handleComment = () => {
        if (!newComment.trim() || !user) return;
        onComment(post.id, newComment);
        setNewComment("");
    };

    const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="bg-white rounded-lg shadow-md p-6 mb-4">
            {/* Post Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-sm">
                            {post.authorName.charAt(0).toUpperCase()}
                        </span>
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900">{post.authorName}</h3>
                        <p className="text-gray-500 text-sm">{formatDate(post.createdAt)}</p>
                    </div>
                </div>
                {user?.uid === post.authorId && onDelete && (
                    <button
                        onClick={() => onDelete(post.id)}
                        className="text-gray-400 hover:text-red-500 transition"
                    >
                        <FaEllipsisH />
                    </button>
                )}
            </div>

            {/* Post Content */}
            <div className="mb-4">
                <p className="text-gray-800 whitespace-pre-wrap">{post.content}</p>
                {post.imageUrl && (
                    <div className="mt-3">
                        <img
                            src={post.imageUrl}
                            alt="Post image"
                            className="rounded-lg max-w-full h-auto max-h-96 object-cover"
                        />
                    </div>
                )}
            </div>

            {/* Post Stats */}
            <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                <div className="flex items-center gap-4">
                    <span>{post.likes.length} {t.likes || 'Likes'}</span>
                    <span>{post.comments.length} {t.comments || 'Comments'}</span>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex border-t border-b border-gray-100 py-2">
                <button
                    onClick={handleLike}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg transition ${isLiked ? 'text-red-500 hover:text-red-600' : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    {isLiked ? <FaHeart /> : <FaRegHeart />}
                    {t.like || 'Like'}
                </button>
                <button
                    onClick={() => setShowComments(!showComments)}
                    className="flex-1 flex items-center justify-center gap-2 py-2 text-gray-500 hover:text-gray-700 rounded-lg transition"
                >
                    <FaComment />
                    {t.comment || 'Comment'}
                </button>
            </div>

            {/* Comments Section */}
            {showComments && (
                <div className="mt-4">
                    {/* Add Comment */}
                    {user && (
                        <div className="flex gap-3 mb-4">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                                <span className="text-white font-bold text-xs">
                                    {user.displayName?.charAt(0).toUpperCase() || 'U'}
                                </span>
                            </div>
                            <div className="flex-1">
                                <textarea
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    placeholder={t.addComment || 'Add a comment...'}
                                    className="w-full p-3 border border-gray-200 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    rows={2}
                                />
                                <div className="flex justify-end mt-2">
                                    <button
                                        onClick={handleComment}
                                        disabled={!newComment.trim()}
                                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {t.postComment || 'Post'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Comments List */}
                    <div className="space-y-3">
                        {post.comments.map((comment) => (
                            <div key={comment.id} className="flex gap-3">
                                <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                                    <span className="text-white font-bold text-xs">
                                        {comment.authorName.charAt(0).toUpperCase()}
                                    </span>
                                </div>
                                <div className="flex-1">
                                    <div className="bg-gray-50 rounded-lg p-3">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-semibold text-gray-900 text-sm">
                                                {comment.authorName}
                                            </span>
                                            <span className="text-gray-400 text-xs">
                                                {formatDate(comment.createdAt)}
                                            </span>
                                        </div>
                                        <p className="text-gray-700 text-sm">{comment.content}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

interface CreatePostProps {
    user: User;
    onCreatePost: (content: string, imageUrl?: string) => void;
    t: any;
}

export const CreatePost = ({ user, onCreatePost, t }: CreatePostProps) => {
    const [content, setContent] = useState("");
    const [imageUrl, setImageUrl] = useState("");

    const handleSubmit = () => {
        if (!content.trim()) return;
        onCreatePost(content, imageUrl || undefined);
        setContent("");
        setImageUrl("");
    };

    return (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-sm">
                        {user.displayName?.charAt(0).toUpperCase() || 'U'}
                    </span>
                </div>
                <div className="flex-1">
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder={t.whatsOnYourMind || "What's on your mind?"}
                        className="w-full p-4 border border-gray-200 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows={3}
                    />
                    <div className="mt-3">
                        <input
                            type="url"
                            value={imageUrl}
                            onChange={(e) => setImageUrl(e.target.value)}
                            placeholder={t.imageUrlOptional || "Image URL (optional)"}
                            className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                    <div className="flex justify-end mt-3">
                        <button
                            onClick={handleSubmit}
                            disabled={!content.trim()}
                            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {t.post || 'Post'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};