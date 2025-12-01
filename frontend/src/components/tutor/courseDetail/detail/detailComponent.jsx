import React, { useState, useEffect, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import './detailComponent.scss'
import Button from '@/components/common/ui/button/buttonClickForm/button.jsx'
import { FaChevronLeft, FaTimes } from 'react-icons/fa'
import axios from '@/services/axios.customize'
import { BASE_API } from '@/constants'

const ITEMS_PER_PAGE = 5

const parseDate = dateStr => {
   if (!dateStr || dateStr === 'Chưa xếp lịch') return new Date(0)
   const [day, month, year] = dateStr.split('/')
   return new Date(year, month - 1, day)
}

const DetailComponent = () => {
   const { id: meetingId } = useParams()

   // --- STATE DỮ LIỆU ---
   const [meetingInfo, setMeetingInfo] = useState(null) // <-- MỚI: Lưu thông tin môn học
   const [schedules, setSchedules] = useState([])
   const [loadingSchedules, setLoadingSchedules] = useState(true)
   const [students, setStudents] = useState([])
   const [loadingStudents, setLoadingStudents] = useState(false)

   // --- STATE UI ---
   const [currentView, setCurrentView] = useState('list')
   const [selectedSession, setSelectedSession] = useState(null)
   const [currentPage, setCurrentPage] = useState(1)

   // --- STATE MODAL ---
   const [isModalOpen, setIsModalOpen] = useState(false)
   const [editingStudent, setEditingStudent] = useState(null)
   const [formData, setFormData] = useState({ progress: '', comment: '' })

   // 1. LẤY THÔNG TIN CHUNG (Môn học + Lịch dạy)
   useEffect(() => {
      const fetchData = async () => {
         if (!meetingId) return
         setLoadingSchedules(true)
         try {
            // A. Lấy thông tin Môn học (Meeting)
            const resMeeting = await axios.get(`${BASE_API}/meeting/${meetingId}`)
            if (resMeeting.data && resMeeting.data.data) {
               setMeetingInfo(resMeeting.data.data)
            }

            // B. Lấy danh sách Sessions
            const resSession = await axios.get(`${BASE_API}/session/meeting/${meetingId}`)
            const sessionsData = resSession.data.data || []

            // C. Lấy Slots cho từng Session
            const promises = sessionsData.map(async session => {
               try {
                  const resSlot = await axios.get(`${BASE_API}/session-slot/session/${session._id}`)
                  const slots = resSlot.data.data || []

                  // Flat map ra tất cả slot
                  const formattedSlots = slots.map(slot => ({
                     id: session._id, // Session ID
                     slotId: slot._id, // Slot ID (để lấy SV)
                     title: session.title, // Tên bài học

                     date: slot.date
                        ? new Date(slot.date).toLocaleDateString('en-GB')
                        : 'Chưa xếp lịch',
                     time:
                        slot.start_time && slot.end_time
                           ? `${slot.start_time} - ${slot.end_time}`
                           : '...',
                     method:
                        slot.location_or_link && slot.location_or_link.includes('http')
                           ? 'Trực tuyến'
                           : 'Trực tiếp',
                     location: slot.location_or_link || 'Chưa cập nhật',
                     rawDate: slot.date ? new Date(slot.date) : new Date(0),
                  }))

                  // Nếu session không có slot nào thì trả về 1 object rỗng để hiện (hoặc lọc bỏ tùy ý)
                  if (formattedSlots.length === 0) {
                     return [
                        {
                           id: session._id,
                           slotId: null,
                           title: session.title,
                           date: 'Chưa xếp lịch',
                           time: '...',
                           method: '...',
                           location: '...',
                           rawDate: new Date(0),
                        },
                     ]
                  }

                  return formattedSlots
               } catch (err) {
                  return []
               }
            })

            const results = await Promise.all(promises)
            // Làm phẳng mảng và sắp xếp
            const allSlots = results.flat().sort((a, b) => b.rawDate - a.rawDate)

            setSchedules(allSlots)
         } catch (error) {
            console.error('Lỗi lấy dữ liệu:', error)
         } finally {
            setLoadingSchedules(false)
         }
      }
      fetchData()
   }, [meetingId])

   // 2. LẤY DANH SÁCH SINH VIÊN (Theo Slot ID)
   const handleViewStudents = async sessionData => {
      if (!sessionData.slotId) {
         alert('Buổi này chưa có lịch (Slot) nên chưa có danh sách sinh viên.')
         return
      }

      setSelectedSession(sessionData)
      setCurrentView('students')
      setLoadingStudents(true)

      try {
         const res = await axios.get(
            `${BASE_API}/student-with-session-slot/session/${sessionData.slotId}`
         )
         const rawData = res.data.data || []

         const studentList = rawData.map(item => ({
            id: item.student?._id || item._id,
            name: item.student?.full_name || 'Không tên',
            mssv: item.student?.id_student || '---',
            email: item.student?.email || '',
            status: 'pending',
            progress: '',
            comment: '',
         }))

         setStudents(studentList)
      } catch (error) {
         console.error('Lỗi lấy sinh viên:', error)
         setStudents([])
      } finally {
         setLoadingStudents(false)
      }
   }

   const handleBackToList = () => {
      setSelectedSession(null)
      setStudents([])
      setCurrentView('list')
   }

   // --- MODAL & LOGIC KHÁC ---
   const handleOpenAssessModal = student => {
      setEditingStudent(student)
      setFormData({
         progress: student.progress || '',
         comment: student.comment || '',
      })
      setIsModalOpen(true)
   }

   const handleSaveAssessment = () => {
      if (!editingStudent) return
      const updatedStudents = students.map(s =>
         s.id === editingStudent.id ? { ...s, status: 'done', ...formData } : s
      )
      setStudents(updatedStudents)
      setIsModalOpen(false)
   }

   const sortedAndPaginatedSchedules = useMemo(() => {
      const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
      return schedules.slice(startIndex, startIndex + ITEMS_PER_PAGE)
   }, [schedules, currentPage])

   const totalPages = Math.ceil(schedules.length / ITEMS_PER_PAGE)
   const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1)

   // --- RENDER UI ---

   const renderAssessModal = () => {
      if (!isModalOpen || !editingStudent) return null
      // ... (Phần Modal giữ nguyên như cũ) ...
      return (
         <div className="assess-modal-overlay">
            <div className="assess-modal-content">
               <div className="modal-header">
                  <h3>Ghi nhận tiến độ</h3>
                  <FaTimes className="close-icon" onClick={() => setIsModalOpen(false)} />
               </div>
               <div className="modal-body">
                  {/* ... nội dung modal ... */}
                  <div className="student-info-row">
                     <div className="info-group">
                        <label>Họ tên</label>
                        <div className="read-only-box">{editingStudent.name}</div>
                     </div>
                  </div>
                  <div className="form-group">
                     <label>Tiến độ (%)</label>
                     <input
                        className="custom-input"
                        value={formData.progress}
                        onChange={e => setFormData({ ...formData, progress: e.target.value })}
                     />
                  </div>
                  <div className="form-group">
                     <label>Nhận xét</label>
                     <textarea
                        className="custom-input"
                        rows={3}
                        value={formData.comment}
                        onChange={e => setFormData({ ...formData, comment: e.target.value })}
                     />
                  </div>
               </div>
               <div className="modal-footer">
                  <Button className="btn-save" onClick={handleSaveAssessment}>
                     Lưu
                  </Button>
               </div>
            </div>
         </div>
      )
   }

   const renderScheduleList = () => (
      <div className="schedule-list-view">
         {/* Hiển thị Tên Môn Học to ở ngoài danh sách */}
         <div className="view-header">
            <h2>{meetingInfo?.title_meeting || 'Đang tải thông tin môn học...'}</h2>
         </div>

         {loadingSchedules ? (
            <p style={{ textAlign: 'center', padding: '20px' }}>Đang tải dữ liệu...</p>
         ) : schedules.length === 0 ? (
            <p style={{ textAlign: 'center', padding: '20px' }}>Chưa có buổi học nào.</p>
         ) : (
            <>
               <div className="schedule-cards-container">
                  {sortedAndPaginatedSchedules.map((item, index) => (
                     <div key={index} className="schedule-card">
                        <div className="card-left">
                           <h3 className="date-title">Ngày {item.date}</h3>
                           <div className="info-row">
                              <span className="label">Nội dung:</span>
                              <div
                                 className="value-box"
                                 style={{ fontWeight: 'bold', color: '#0044cc' }}
                              >
                                 {item.title}
                              </div>
                           </div>
                           <div className="info-row">
                              <span className="label">Giờ:</span>
                              <div className="value-box">{item.time}</div>
                           </div>
                           <div className="info-row">
                              <span className="label">Địa điểm:</span>
                              <div className="value-box">{item.location}</div>
                           </div>
                        </div>
                        <div className="card-right">
                           <Button
                              className="btn-view-list"
                              onClick={() => handleViewStudents(item)}
                              disabled={!item.slotId}
                              style={{ opacity: !item.slotId ? 0.6 : 1 }}
                           >
                              {item.slotId ? 'Danh sách sinh viên' : 'Chưa xếp lịch'}
                           </Button>
                        </div>
                     </div>
                  ))}
               </div>
               {/* Pagination giữ nguyên */}
               {totalPages > 1 && (
                  <div className="pagination">
                     {pageNumbers.map(page => (
                        <span
                           key={page}
                           className={page === currentPage ? 'active' : ''}
                           onClick={() => setCurrentPage(page)}
                        >
                           {page}
                        </span>
                     ))}
                  </div>
               )}
            </>
         )}
      </div>
   )

   // --- SỬA LẠI UI CHI TIẾT SINH VIÊN ---
   const renderStudentList = () => (
      <div className="student-list-view">
         <div className="back-nav" onClick={handleBackToList}>
            <FaChevronLeft /> Quay lại danh sách buổi học
         </div>

         <div className="view-header">
            {/* Hiển thị rõ Tên Môn Học */}
            <h2 style={{ color: '#333' }}>Môn: {meetingInfo?.title_meeting}</h2>
         </div>

         <div className="session-info-panel">
            <div className="info-grid">
               {/* Thêm ô hiển thị Nội dung bài học */}
               <div className="info-item full-width">
                  <span className="label">Nội dung:</span>
                  <div className="value-box" style={{ fontWeight: 'bold', color: '#0044cc' }}>
                     {selectedSession?.title}
                  </div>
               </div>

               <div className="info-item">
                  <span className="label">Thời gian:</span>
                  <div className="value-box">{selectedSession?.time}</div>
               </div>
               <div className="info-item">
                  <span className="label">Hình thức:</span>
                  <div className="value-box">{selectedSession?.method}</div>
               </div>
               <div className="info-item full-width">
                  <span className="label">Địa điểm:</span>
                  <div className="value-box">{selectedSession?.location}</div>
               </div>
            </div>
         </div>

         <div className="student-table-section">
            <h3>Danh sách sinh viên ({students.length})</h3>
            {loadingStudents ? (
               <p>Đang tải...</p>
            ) : (
               <table className="student-table">
                  <thead>
                     <tr>
                        <th>STT</th>
                        <th>Họ tên</th>
                        <th>MSSV</th>
                        <th>Email</th>
                        <th style={{ textAlign: 'right' }}>Đánh giá</th>
                     </tr>
                  </thead>
                  <tbody>
                     {students.length === 0 ? (
                        <tr>
                           <td colSpan="5" style={{ textAlign: 'center' }}>
                              Chưa có sinh viên.
                           </td>
                        </tr>
                     ) : (
                        students.map((st, i) => (
                           <tr key={st.id || i}>
                              <td>{i + 1}</td>
                              <td style={{ fontWeight: 'bold' }}>{st.name}</td>
                              <td>{st.mssv}</td>
                              <td>{st.email}</td>
                              <td style={{ textAlign: 'right' }}>
                                 <button
                                    className={`status-btn ${st.status}`}
                                    onClick={() => handleOpenAssessModal(st)}
                                 >
                                    {st.status === 'pending' ? 'Chưa ghi nhận' : 'Đã ghi nhận'}
                                 </button>
                              </td>
                           </tr>
                        ))
                     )}
                  </tbody>
               </table>
            )}
         </div>
      </div>
   )

   return (
      <div className="detail-component-wrapper">
         {currentView === 'list' ? renderScheduleList() : renderStudentList()}
         {renderAssessModal()}
      </div>
   )
}

export default DetailComponent
