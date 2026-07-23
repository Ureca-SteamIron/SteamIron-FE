// features/comment/components/CommentSection.jsx
import { useEffect, useState } from 'react'
import Box from '../../../shared/components/Box'
import { getSession } from '../../../shared/utils/auth'
import {
  getComments,
  createComment,
  updateComment,
  deleteComment,
  adminDeleteComment,
} from '../api/commentApi'

// 삭제된 댓글은 화면에서 완전히 제거 (children까지 함께 제거)
function filterDeleted(comments) {
  return comments
    .filter((c) => !c.deleted)
    .map((c) => ({ ...c, children: filterDeleted(c.children ?? []) }))
}

const textareaClass =
  'w-full resize-vertical font-[inherit] bg-[#26262c] text-[#e8e8ea] text-sm rounded-lg border border-[#2c2c33] px-3 py-2.5 outline-none placeholder:text-[#7a7a82] focus:border-[#4a4a52]'

function CommentItem({ comment, currentUserId, isAdmin, onReply, onUpdate, onDelete, onAdminDelete }) {
  const [replying, setReplying] = useState(false)
  const [editing, setEditing] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [editText, setEditText] = useState(comment.content)

  const isMine = currentUserId === comment.userId
  const replyCount = comment.children?.length ?? 0

  return (
    <div
      className={comment.depth > 0 ? 'pl-6 border-l border-[#2c2c33]' : ''}
      style={{ marginLeft: comment.depth * 24 }}
    >
      <div className="mt-2.5 p-3.5 rounded-xl border border-[#2c2c33] bg-[#1b1b1f]">
        <div className="font-bold text-sm text-[#f2f2f4]">{comment.nickname}</div>
        <div className="mt-1 text-sm text-[#e8e8ea] whitespace-pre-wrap break-words">
          {comment.content}
        </div>
        <div className="text-xs text-[#7a7a82] mt-1.5">
          {new Date(comment.createdAt).toLocaleString()}
        </div>

        <div className="flex gap-3 mt-2 text-xs">
          {currentUserId && comment.depth === 0 && (
            <span
              className="cursor-pointer text-[#9a9aa2] transition-colors duration-150 hover:text-[#e8e8ea]"
              onClick={() => setReplying((v) => !v)}
            >
              답글
            </span>
          )}
          {isMine && (
            <>
              <span
                className="cursor-pointer text-[#9a9aa2] transition-colors duration-150 hover:text-[#e8e8ea]"
                onClick={() => setEditing((v) => !v)}
              >
                수정
              </span>
              <span
                className="cursor-pointer text-[#9a9aa2] transition-colors duration-150 hover:text-red-400"
                onClick={() => onDelete(comment.id)}
              >
                삭제
              </span>
            </>
          )}
          {!isMine && isAdmin && (
            <span
              className="cursor-pointer text-red-400 transition-colors duration-150 hover:text-red-300"
              onClick={() => onAdminDelete(comment.id)}
            >
              삭제(관리자)
            </span>
          )}
        </div>

        {editing && (
          <div className="mt-2.5">
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              rows={2}
              className={textareaClass}
            />
            <div
              onClick={() => {
                onUpdate(comment.id, editText)
                setEditing(false)
              }}
              className="inline-block mt-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-[#0e0e10] bg-green-400 cursor-pointer transition-colors duration-150 hover:bg-green-300"
            >
              저장
            </div>
          </div>
        )}

        {replying && (
          <div className="mt-2.5">
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="답글을 입력하세요"
              rows={2}
              className={textareaClass}
            />
            <div
              onClick={() => {
                if (!replyText.trim()) return
                onReply(comment.id, replyText)
                setReplyText('')
                setReplying(false)
                setExpanded(true)
              }}
              className="inline-block mt-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-[#0e0e10] bg-green-400 cursor-pointer transition-colors duration-150 hover:bg-green-300"
            >
              등록
            </div>
          </div>
        )}

        {replyCount > 0 && (
          <div
            className="mt-2.5 text-xs text-green-400 cursor-pointer transition-colors duration-150 hover:text-green-300"
            onClick={() => setExpanded((v) => !v)}
          >
            {expanded ? '답글 숨기기' : `답글 ${replyCount}개 보기`}
          </div>
        )}
      </div>

      {expanded &&
        comment.children?.map((child) => (
          <CommentItem
            key={child.id}
            comment={child}
            currentUserId={currentUserId}
            isAdmin={isAdmin}
            onReply={onReply}
            onUpdate={onUpdate}
            onDelete={onDelete}
            onAdminDelete={onAdminDelete}
          />
        ))}
    </div>
  )
}

export default function CommentSection({ gameId }) {
  const user = getSession()
  const isAdmin = user?.role === 'ADMIN'

  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [newComment, setNewComment] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const loadComments = () => {
    setLoading(true)
    setError(null)
    getComments(gameId)
      .then((page) => setComments(filterDeleted(page.content ?? [])))
      .catch((err) => setError(err.response?.data?.message ?? err.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadComments()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameId])

  const handleSubmit = () => {
    if (!newComment.trim()) return
    setSubmitting(true)
    createComment(gameId, { content: newComment })
      .then(() => {
        setNewComment('')
        loadComments()
      })
      .catch((err) => setError(err.response?.data?.message ?? err.message))
      .finally(() => setSubmitting(false))
  }

  const handleReply = (parentId, content) => {
    createComment(gameId, { parentId, content })
      .then(loadComments)
      .catch((err) => setError(err.response?.data?.message ?? err.message))
  }

  const handleUpdate = (commentId, content) => {
    updateComment(commentId, content)
      .then(loadComments)
      .catch((err) => setError(err.response?.data?.message ?? err.message))
  }

  const handleDelete = (commentId) => {
    deleteComment(commentId)
      .then(loadComments)
      .catch((err) => setError(err.response?.data?.message ?? err.message))
  }

  const handleAdminDelete = (commentId) => {
    if (!window.confirm('관리자 권한으로 이 댓글을 삭제하시겠습니까?')) return
    adminDeleteComment(commentId)
      .then(loadComments)
      .catch((err) => setError(err.response?.data?.message ?? err.message))
  }

  return (
    <Box
      noDefaultStyle
      className="mt-6 p-5 rounded-xl border border-[#2c2c33] bg-[#1b1b1f]"
    >
      <div className="font-bold text-sm text-[#f2f2f4]">커뮤니티 (댓글 / 대댓글)</div>

      {error && <div className="text-red-400 text-sm mt-2">{error}</div>}
      {loading && <div className="text-[#9a9aa2] text-sm mt-2">불러오는 중...</div>}

      {!loading &&
        comments.map((comment) => (
          <CommentItem
            key={comment.id}
            comment={comment}
            currentUserId={user?.userId}
            isAdmin={isAdmin}
            onReply={handleReply}
            onUpdate={handleUpdate}
            onDelete={handleDelete}
            onAdminDelete={handleAdminDelete}
          />
        ))}

      {user ? (
        <div className="mt-4">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="댓글을 입력하세요"
            rows={3}
            className={textareaClass}
          />
          <div
            onClick={handleSubmit}
            className={`inline-block mt-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors duration-150 ${
              submitting
                ? 'cursor-default opacity-50 text-[#0e0e10] bg-green-400'
                : 'cursor-pointer text-[#0e0e10] bg-green-400 hover:bg-green-300'
            }`}
          >
            {submitting ? '등록 중...' : '등록'}
          </div>
        </div>
      ) : (
        <div className="mt-4 inline-block text-sm text-[#9a9aa2]">
          로그인 후 댓글을 작성할 수 있습니다.
        </div>
      )}
    </Box>
  )
}