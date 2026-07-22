import axiosClient from '../../../shared/api/axiosClient'

// BE CommentResponse: { id, userId, nickname, content, depth, createdAt, deleted, children }
// GET은 인증 없이도 조회 가능(SecurityConfig에서 GET /api/games/** permitAll)
// page, size, sort는 Spring Pageable 규격을 그대로 쿼리 파라미터로 전달
export async function getComments(gameId, { page = 0, size = 20, sort = 'createdAt,asc' } = {}) {
    const { data } = await axiosClient.get(`/api/games/${gameId}/comments`, {
        params: { page, size, sort },
    })

    return data // Page<CommentResponse> - success/data 래핑 없이 그대로 내려옴
}

// BE POST /api/games/{gameId}/comments: 최상위 댓글 작성
// parentId를 생략(undefined/null)하면 depth 0인 원댓글로 생성됨
export async function createComment(gameId, { parentId = null, content }) {
    const { data } = await axiosClient.post(`/api/games/${gameId}/comments`, {
        parentId,
        content,
    })

    return data // CommentResponse - 래핑 없이 그대로 내려옴
}

// BE PATCH /api/comments/{commentId}: 본인 댓글만 수정 가능 (인증 필요)
export async function updateComment(commentId, content) {
    const { data } = await axiosClient.patch(`/api/comments/${commentId}`, { content })
    return data
}

// BE DELETE /api/comments/{commentId}: 본인 댓글만 삭제(soft delete) 가능, 대댓글도 함께 삭제 처리됨
export async function deleteComment(commentId) {
    const { data } = await axiosClient.delete(`/api/comments/${commentId}`)
    return data
}

// BE DELETE /api/admin/comments/{commentId}: ADMIN 권한만 호출 가능 (@PreAuthorize)
export async function adminDeleteComment(commentId) {
    const { data } = await axiosClient.delete(`/api/admin/comments/${commentId}`)
    return data
}

// BE GET /api/users/me/comments: 내가 쓴 댓글 목록 (게임 정보 포함, 삭제된 댓글은 제외)
export async function getMyComments({ page = 0, size = 20 } = {}) {
  const { data } = await axiosClient.get('/api/users/me/comments', {
    params: { page, size },
  })
  return data
}