// features/comment/components/CommentSection.jsx
import { useEffect, useState } from 'react'
import Box from '../../../shared/components/Box'
import { getSession } from '../../../shared/utils/auth'
import {
  getComments,
  createComment,
  updateComment,
  deleteComment,
} from '../api/commentApi'

// 삭제된 댓글은 화면에서 완전히 제거 (children까지 함께 제거)
function filterDeleted(comments) {
  return comments
    .filter((c) => !c.deleted)
    .map((c) => ({ ...c, children: filterDeleted(c.children ?? []) }))
}

function CommentItem({ comment, currentUserId, onReply, onUpdate, onDelete }) {
  const [replying, setReplying] = useState(false)
  const [editing, setEditing] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [editText, setEditText] = useState(comment.content)

  const isMine = currentUserId === comment.userId
  const replyCount = comment.children?.length ?? 0

  return (
    <div style={{ marginLeft: comment.depth * 24 }}>
      <Box style={{ marginTop: '10px' }}>
        <div style={{ fontWeight: 'bold' }}>{comment.nickname}</div>
        <div>{comment.content}</div>
        <div style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>
          {new Date(comment.createdAt).toLocaleString()}
        </div>

        <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
          {currentUserId && comment.depth === 0 && (
            <span style={{ cursor: 'pointer' }} onClick={() => setReplying((v) => !v)}>
              답글
            </span>
          )}
          {isMine && (
            <>
              <span style={{ cursor: 'pointer' }} onClick={() => setEditing((v) => !v)}>
                수정
              </span>
              <span style={{ cursor: 'pointer' }} onClick={() => onDelete(comment.id)}>
                삭제
              </span>
            </>
          )}
        </div>

        {editing && (
          <div style={{ marginTop: '8px' }}>
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              rows={2}
              style={{ width: '100%', resize: 'vertical', fontFamily: 'inherit' }}
            />
            <Box
              onClick={() => {
                onUpdate(comment.id, editText)
                setEditing(false)
              }}
              style={{ display: 'inline-block', marginTop: '4px', cursor: 'pointer' }}
            >
              저장
            </Box>
          </div>
        )}

        {replying && (
          <div style={{ marginTop: '8px' }}>
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="답글을 입력하세요"
              rows={2}
              style={{ width: '100%', resize: 'vertical', fontFamily: 'inherit' }}
            />
            <Box
              onClick={() => {
                if (!replyText.trim()) return
                onReply(comment.id, replyText)
                setReplyText('')
                setReplying(false)
                setExpanded(true)
              }}
              style={{ display: 'inline-block', marginTop: '4px', cursor: 'pointer' }}
            >
              등록
            </Box>
          </div>
        )}

        {replyCount > 0 && (
          <div
            style={{ marginTop: '8px', cursor: 'pointer', color: '#3366cc' }}
            onClick={() => setExpanded((v) => !v)}
          >
            {expanded ? '답글 숨기기' : `답글 ${replyCount}개 보기`}
          </div>
        )}
      </Box>

      {expanded &&
        comment.children?.map((child) => (
          <CommentItem
            key={child.id}
            comment={child}
            currentUserId={currentUserId}
            onReply={onReply}
            onUpdate={onUpdate}
            onDelete={onDelete}
          />
        ))}
    </div>
  )
}

export default function CommentSection({ gameId }) {
  const user = getSession()

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

  return (
    <Box style={{ marginTop: '20px' }}>
      <div>커뮤니티 (댓글 / 대댓글)</div>

      {error && <div style={{ color: 'red', marginTop: '8px' }}>{error}</div>}
      {loading && <div style={{ marginTop: '8px' }}>불러오는 중...</div>}

      {!loading &&
        comments.map((comment) => (
          <CommentItem
            key={comment.id}
            comment={comment}
            currentUserId={user?.userId}
            onReply={handleReply}
            onUpdate={handleUpdate}
            onDelete={handleDelete}
          />
        ))}

      {user ? (
        <div style={{ marginTop: '15px' }}>
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="댓글을 입력하세요"
            rows={3}
            style={{ width: '100%', resize: 'vertical', fontFamily: 'inherit' }}
          />
          <Box
            onClick={handleSubmit}
            style={{ display: 'inline-block', marginTop: '6px', cursor: submitting ? 'default' : 'pointer', opacity: submitting ? 0.5 : 1 }}
          >
            {submitting ? '등록 중...' : '등록'}
          </Box>
        </div>
      ) : (
        <Box style={{ marginTop: '15px', display: 'inline-block' }}>로그인 후 댓글을 작성할 수 있습니다.</Box>
      )}
    </Box>
  )
}