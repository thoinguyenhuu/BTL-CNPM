import { useState, useEffect } from 'react'
import './profileTutor.scss'
import axios from '@/services/axios.customize'
import { BASE_API } from '@/constants'


const ProfileTutor = () => {
  // Hardcode data - bạn sẽ thay bằng axios sau

  const [tutorData, setTutorData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTutorProfile = async () => {
      try {
        const tutorID = localStorage.getItem('id')
        const res = await axios.get(`${BASE_API}/tutor/${tutorID}`)
        
        if (res.data.EC === 0) {
          setTutorData(res.data.data)
        }
      } catch (error) {
        console.log('Error fetching tutor profile:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchTutorProfile()
  }, [])

  if (loading) return <div className="loading">Đang tải...</div>
  if (!tutorData) return <div className="error">Không tìm thấy thông tin</div>

  return (
    <div className="profile-container">
      <div className="profile-wrapper">
        {/* Header Card */}
        <div className="profile-header">
          <div className="header-content">
            {/* Avatar */}
            <div className="avatar">
              {tutorData.full_name.charAt(0)}
            </div>
            
            {/* Name and Role */}
            <div className="user-info">
              <h1 className="user-name">{tutorData.full_name}</h1>
              <p className="user-role">
                <span className="icon">🛡️</span>
                Giảng viên
              </p>
            </div>

            {/* Status Badge */}
            <div className={`status-badge ${tutorData.is_active ? 'active' : 'inactive'}`}>
              <span className="status-icon">
                {tutorData.is_active ? '✓' : '✕'}
              </span>
              <span className="status-text">
                {tutorData.is_active ? 'Đang hoạt động' : 'Không hoạt động'}
              </span>
            </div>
          </div>
        </div>

        {/* Details Card */}
        <div className="profile-details">
          <h2 className="details-title">Chi tiết người dùng</h2>

          <div className="details-list">
            {/* Student ID */}
            <div className="detail-item">
              <div className="detail-icon blue">
                <span>👤</span>
              </div>
              <div className="detail-content">
                <p className="detail-label">Mã giảng viên</p>
                <p className="detail-value">{tutorData.id}</p>
              </div>
            </div>

            {/* Email */}
            <div className="detail-item">
              <div className="detail-icon purple">
                <span>✉️</span>
              </div>
              <div className="detail-content">
                <p className="detail-label">Địa chỉ thư điện tử</p>
                <p className="detail-value">{tutorData.email}</p>
              </div>
            </div>

            {/* Faculty */}
            <div className="detail-item">
              <div className="detail-icon green">
                <span>🏢</span>
              </div>
              <div className="detail-content">
                <p className="detail-label">Khoa</p>
                <p className="detail-value">{tutorData.faculty.name}</p>
              </div>
            </div>

            {/* Country */}
            <div className="detail-item">
              <div className="detail-icon orange">
                <span>🇻🇳</span>
              </div>
              <div className="detail-content">
                <p className="detail-label">Quốc gia</p>
                <p className="detail-value">Việt Nam</p>
              </div>
            </div>

            {/* City */}
            <div className="detail-item">
              <div className="detail-icon pink">
                <span>🏙️</span>
              </div>
              <div className="detail-content">
                <p className="detail-label">Tỉnh/Thành phố</p>
                <p className="detail-value">HCM</p>
              </div>
            </div>

            {/* Timezone */}
            <div className="detail-item">
              <div className="detail-icon indigo">
                <span>🕐</span>
              </div>
              <div className="detail-content">
                <p className="detail-label">Múi giờ</p>
                <p className="detail-value">Asia/Ho_Chi_Minh</p>
              </div>
            </div>
          </div>
        </div>

        
      </div>
    </div>
  )
}

export default ProfileTutor