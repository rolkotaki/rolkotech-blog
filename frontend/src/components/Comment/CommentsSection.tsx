import { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { blogpostService } from "../../services/blogpost.service";
import Comment from "./Comment";
import LoadingSpinner from "../Common/LoadingSpinner";
import ErrorMessageWithDismissProps from "../Common/ErrorMessageWithDismiss";
import { COMMENTS_PER_LOAD } from "../../types/blogpost";
import type { CommentWithReplies } from "../../types";

interface CommentsSectionProps {
  blogPostUrl: string;
  currentUsername?: string;
  isCurrentUserSuperUser?: boolean;
}

function CommentsSection({
  blogPostUrl,
  currentUsername,
  isCurrentUserSuperUser
}: CommentsSectionProps) {
  const [comments, setComments] = useState<CommentWithReplies[]>([]);
  const [totalCommentsCount, setTotalCommentsCount] = useState<number>(0);
  const [newComment, setNewComment] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [loadingMoreCommentsError, setLoadingMoreCommentsError] =
    useState<string>("");
  const [loadingMoreComments, setLoadingMoreComments] =
    useState<boolean>(false);
  const [currentCommentPage, setCurrentCommentPage] = useState<number>(1);
  const [hasMoreComments, setHasMoreComments] = useState<boolean>(true);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Fetch comments on component mount
  useEffect(() => {
    const fetchComments = async () => {
      try {
        setLoading(true);
        const response = await blogpostService.getCommentsForBlogPost(
          blogPostUrl,
          1
        );
        setComments(response.data);
        setTotalCommentsCount(response.count);
        setHasMoreComments(response.data.length === COMMENTS_PER_LOAD);
      } catch (err) {
        setError("Failed to load comments");
        console.error("Error fetching comments:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchComments();
  }, [blogPostUrl]);

  // Load more comments
  const loadMoreComments = useCallback(async () => {
    if (!hasMoreComments || loadingMoreComments) return;

    try {
      setLoadingMoreComments(true);
      const nextPage = currentCommentPage + 1;
      const response = await blogpostService.getCommentsForBlogPost(
        blogPostUrl,
        nextPage
      );

      if (response.data.length > 0) {
        setComments((prevComments) => [...prevComments, ...response.data]);
        setCurrentCommentPage(nextPage);
        setHasMoreComments(response.data.length === COMMENTS_PER_LOAD);
      } else {
        setHasMoreComments(false);
      }
    } catch (err) {
      setLoadingMoreCommentsError("Failed to load more comments");
      console.error("Error loading more comments:", err);
    } finally {
      setLoadingMoreComments(false);
    }
  }, [blogPostUrl, currentCommentPage, hasMoreComments, loadingMoreComments]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (
          entry.isIntersecting &&
          hasMoreComments &&
          !loadingMoreComments &&
          !loading
        ) {
          loadMoreComments();
        }
      },
      {
        threshold: 0.1, // Trigger when 10% of the element is visible
        rootMargin: "100px" // Start detecting 100px before the element actually enters the viewport
      }
    );

    const currentLoadMoreRef = loadMoreRef.current;
    if (currentLoadMoreRef) {
      observer.observe(currentLoadMoreRef);
    }

    return () => {
      if (currentLoadMoreRef) {
        observer.unobserve(currentLoadMoreRef);
      }
    };
  }, [hasMoreComments, loadingMoreComments, loading, loadMoreComments]);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setIsSubmitting(true);
    try {
      const new_comment = await blogpostService.createComment(blogPostUrl, {
        content: newComment.trim(),
        reply_to: null
      });

      // Add new comment to local state
      setComments((prevComments) => [
        {
          id: new_comment.id,
          content: new_comment.content,
          comment_date: new_comment.comment_date,
          blog_post_id: new_comment.blog_post_id,
          reply_to: new_comment.reply_to,
          username: new_comment.username,
          replies: []
        },
        ...prevComments
      ]);
      setTotalCommentsCount((prevCount) => prevCount + 1);
      setNewComment("");
    } catch (err) {
      console.error("Error creating comment:", err);
      setError("Failed to post comment");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditComment = async (id: number, newContent: string) => {
    try {
      const updated_comment = await blogpostService.updateComment(
        blogPostUrl,
        id,
        {
          content: newContent
        }
      );

      // Update local state
      setComments(
        comments.map((comment) =>
          comment.id === id
            ? { ...comment, content: updated_comment.content }
            : comment
        )
      );
    } catch (err) {
      console.error("Error updating comment:", err);
      setError("Failed to update comment");
    }
  };

  const handleDeleteComment = async (id: number) => {
    try {
      await blogpostService.deleteComment(blogPostUrl, id);

      // Remove from local state
      const numberOfReplies = comments.find((comment) => comment.id === id)
        ?.replies.length;
      setComments(comments.filter((comment) => comment.id !== id));
      setTotalCommentsCount(
        (prevCount) => prevCount - 1 - (numberOfReplies || 0)
      );
    } catch (err) {
      console.error("Error deleting comment:", err);
      setError("Failed to delete comment");
    }
  };

  const handleReply = async (parentId: number, content: string) => {
    try {
      const new_comment = await blogpostService.createComment(blogPostUrl, {
        content: content,
        reply_to: parentId
      });

      // Add new reply to local state
      setComments(
        comments.map((comment) =>
          comment.id === parentId
            ? { ...comment, replies: [...comment.replies, new_comment] }
            : comment
        )
      );
      setTotalCommentsCount((prevCount) => prevCount + 1);
    } catch (err) {
      console.error("Error creating reply:", err);
      setError("Failed to post reply");
    }
  };

  const handleEditReply = async (
    parentId: number,
    replyId: number,
    newContent: string
  ) => {
    try {
      const updated_comment = await blogpostService.updateComment(
        blogPostUrl,
        replyId,
        {
          content: newContent
        }
      );

      // Update local state
      setComments(
        comments.map((comment) =>
          comment.id === parentId
            ? {
                ...comment,
                replies: comment.replies.map((reply) =>
                  reply.id === replyId
                    ? { ...reply, content: updated_comment.content }
                    : reply
                )
              }
            : comment
        )
      );
    } catch (err) {
      console.error("Error updating reply:", err);
      setError("Failed to update reply");
    }
  };

  const handleDeleteReply = async (parentId: number, replyId: number) => {
    try {
      await blogpostService.deleteComment(blogPostUrl, replyId);

      // Remove from local state
      setComments(
        comments.map((comment) =>
          comment.id === parentId
            ? {
                ...comment,
                replies: comment.replies.filter((reply) => reply.id !== replyId)
              }
            : comment
        )
      );
      setTotalCommentsCount((prevCount) => prevCount - 1);
    } catch (err) {
      console.error("Error deleting reply:", err);
      setError("Failed to delete reply");
    }
  };

  return (
    <div className="max-w-3xl mx-auto mt-12 px-4">
      {/* Comments header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Comments ({totalCommentsCount})
        </h2>
        <div className="w-16 h-1 bg-blue-600 rounded"></div>
      </div>

      {/* Error message */}
      {error && (
        <ErrorMessageWithDismissProps
          message={error}
          onDismiss={() => setError("")}
        />
      )}

      {/* Post Comment form */}
      {!currentUsername ? (
        <div className="mt-3 mb-8 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-blue-800 text-sm">
            <span className="font-medium">Want to join the conversation?</span>{" "}
            <Link
              to="/login"
              className="text-blue-600 hover:text-blue-800 underline"
            >
              Log in
            </Link>{" "}
            or{" "}
            <Link
              to="/signup"
              className="text-blue-600 hover:text-blue-800 underline"
            >
              sign up
            </Link>{" "}
            to leave a comment.
          </p>
        </div>
      ) : (
        <form className="mb-8" onSubmit={handleSubmitComment}>
          <div>
            <textarea
              value={newComment}
              onChange={(e) => {
                const value = e.target.value;
                if (value.length <= 1000) {
                  setNewComment(value);
                }
              }}
              placeholder="Leave a comment..."
              className="w-full p-4 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              rows={4}
              maxLength={1000}
              disabled={!currentUsername || isSubmitting || loading}
            />

            <div className="flex justify-between items-center mt-1">
              <span
                className={`text-xs ${
                  newComment.length > 990 ? "text-red-500" : "text-gray-500"
                }`}
              >
                {newComment.length}/1000 characters
              </span>
            </div>
          </div>
          <button
            type="submit"
            disabled={
              !currentUsername ||
              !newComment.trim() ||
              newComment.length > 1000 ||
              isSubmitting ||
              loading
            }
            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors mt-3"
          >
            {isSubmitting ? "Posting..." : "Post Comment"}
          </button>
        </form>
      )}
      {/* During loading */}
      {loading ? (
        <LoadingSpinner text="Loading comments..." />
      ) : (
        /* Comments */
        <div>
          {comments.length === 0 ? (
            <div className="text-center pt-4 py-12">
              <p className="text-gray-500">
                No comments yet. Be the first to share your thoughts!
              </p>
            </div>
          ) : (
            comments.map((comment) => (
              <Comment
                key={comment.id}
                id={comment.id}
                username={comment.username}
                content={comment.content}
                commentDate={comment.comment_date}
                currentUsername={currentUsername}
                isCurrentUserSuperUser={isCurrentUserSuperUser}
                replies={comment.replies.map((reply) => ({
                  id: reply.id,
                  username: reply.username,
                  content: reply.content,
                  commentDate: reply.comment_date
                }))}
                onEdit={handleEditComment}
                onDelete={handleDeleteComment}
                onReply={handleReply}
                onEditReply={handleEditReply}
                onDeleteReply={handleDeleteReply}
              />
            ))
          )}

          {/* Loading more comments error message */}
          {loadingMoreCommentsError && (
            <ErrorMessageWithDismissProps
              message={loadingMoreCommentsError}
              onDismiss={() => setLoadingMoreCommentsError("")}
            />
          )}

          {/* Loading more comments trigger element */}
          {hasMoreComments && (
            <div ref={loadMoreRef}>
              {loadingMoreComments && (
                <LoadingSpinner text="Loading more comments..." />
              )}
            </div>
          )}

          {/* No more comments message */}
          {/* We only display it when there is at least COMMENTS_PER_LOAD comments.
              If there is a few comments only, not worth showing it. */}
          {!hasMoreComments && comments.length > COMMENTS_PER_LOAD && (
            <div className="text-center py-8">
              <p className="text-gray-500 text-sm">
                You've reached the end of the comments.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default CommentsSection;
