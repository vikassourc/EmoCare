import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, Video, User, CheckCircle, Loader2, X, Star, MapPin } from 'lucide-react';
import { api } from '../api';

const THERAPISTS = [
  { id: 't1', name: 'Dr. Sarah Chen', specialty: 'Anxiety & Burnout', rating: 4.9, location: 'Telehealth', Icon: User, bg: 'bg-sky-500/10 text-sky-400', bio: 'Specializes in CBT for high-achievers struggling with workplace burnout and generalized anxiety.' },
  { id: 't2', name: 'Dr. Marcus Johnson', specialty: 'Depression & Grief', rating: 4.8, location: 'Telehealth', Icon: User, bg: 'bg-pink-500/10 text-pink-400', bio: 'Compassionate approach to processing grief, major depressive disorder, and life transitions.' },
  { id: 't3', name: 'Elena Rostova, LCSW', specialty: 'Relationships & Trauma', rating: 5.0, location: 'Telehealth', Icon: User, bg: 'bg-emerald-500/10 text-emerald-400', bio: 'Trauma-informed care and EMDR specialist focusing on relationship dynamics and PTSD.' },
  { id: 't4', name: 'Dr. James Wilson', specialty: 'ADHD & Focus', rating: 4.7, location: 'Telehealth', Icon: User, bg: 'bg-amber-500/10 text-amber-400', bio: 'Helping neurodivergent adults build executive function skills and thrive in neurotypical spaces.' },
];

const AVAILABLE_TIMES = ['09:00 AM', '10:30 AM', '01:00 PM', '03:00 PM', '04:30 PM'];

export default function TherapyPage() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bookingModal, setBookingModal] = useState(null); // holds therapist object if open
  const [cancelModal, setCancelModal] = useState(null); // holds appointment id to cancel
  const [cancelling, setCancelling] = useState(false);
  
  // Modal State
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [booking, setBooking] = useState(false);
  const [bookingError, setBookingError] = useState('');

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/appointments', {
        headers: { Authorization: `Bearer ${localStorage.getItem('emocare_token')}` }
      });
      const data = await res.json();
      if (data.success) {
        setAppointments(data.appointments);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleBook = async () => {
    setBookingError('');
    if (!selectedDate && !selectedTime) {
      setBookingError('Please select a date and time.');
      return;
    }
    if (!selectedDate) {
      setBookingError('Please select a date.');
      return;
    }
    if (!selectedTime) {
      setBookingError('Please select a time.');
      return;
    }
    if (!bookingModal) return;

    setBooking(true);
    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('emocare_token')}` 
        },
        body: JSON.stringify({
          therapistId: bookingModal.id,
          therapistName: bookingModal.name,
          specialty: bookingModal.specialty,
          date: selectedDate,
          time: selectedTime
        })
      });
      const data = await res.json();
      if (data.success) {
        setAppointments(prev => [...prev, data.appointment].sort((a,b) => new Date(a.date) - new Date(b.date)));
        setBookingModal(null);
        setSelectedDate('');
        setSelectedTime('');
      } else {
        setBookingError(data.message || 'Failed to book appointment.');
      }
    } catch (err) {
      console.error(err);
      setBookingError('Network error. Please try again.');
    } finally {
      setBooking(false);
    }
  };

  const executeCancel = async () => {
    if (!cancelModal) return;
    setCancelling(true);
    try {
      const res = await fetch(`/api/appointments/${cancelModal}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('emocare_token')}` }
      });
      const data = await res.json();
      if (data.success) {
        setAppointments(prev => prev.filter(a => a._id !== cancelModal));
        setCancelModal(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-8 pb-24" style={{ backgroundColor: 'var(--bg-base)' }}>
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Therapy & Counseling</h1>
        <p className="text-zinc-400">Connect with licensed professionals for video sessions.</p>
      </div>

      {/* Upcoming Appointments */}
      <section>
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Calendar size={20} className="text-indigo-400" />
          Upcoming Sessions
        </h2>
        
        {loading ? (
          <div className="flex items-center gap-2 text-zinc-500 py-4"><Loader2 size={16} className="animate-spin" /> Loading...</div>
        ) : appointments.filter(a => a.status === 'upcoming').length === 0 ? (
          <div className="p-6 rounded-2xl border border-dashed border-zinc-700 bg-white/5 text-center">
            <p className="text-zinc-400">You have no upcoming sessions booked.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {appointments.filter(a => a.status === 'upcoming').map(app => (
              <motion.div key={app._id} initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} 
                className="p-5 rounded-2xl border flex flex-col gap-3"
                style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-white font-medium">{app.therapistName}</h3>
                    <p className="text-xs text-indigo-400 font-medium">{app.specialty}</p>
                  </div>
                  <div className="bg-indigo-500/20 text-indigo-300 text-xs px-2 py-1 rounded-lg flex items-center gap-1">
                    <Video size={12} /> Video Call
                  </div>
                </div>
                <div className="flex gap-4 text-sm text-zinc-400 mt-2">
                  <div className="flex items-center gap-1"><Calendar size={14} /> {app.date}</div>
                  <div className="flex items-center gap-1"><Clock size={14} /> {app.time}</div>
                </div>
                <button onClick={() => setCancelModal(app._id)} className="mt-2 text-xs text-rose-400 hover:text-rose-300 self-start font-medium">
                  Cancel Session
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* Therapist Directory */}
      <section>
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <User size={20} className="text-emerald-400" />
          Available Professionals
        </h2>
        
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-2">
          {THERAPISTS.map(therapist => (
            <motion.div key={therapist.id} whileHover={{ y: -2 }}
              className="p-5 rounded-3xl border flex flex-col sm:flex-row gap-5"
              style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}>
              
              <div className={`w-20 h-20 rounded-2xl flex items-center justify-center shadow-inner shrink-0 border border-white/5 ${therapist.bg || 'bg-gradient-to-br from-indigo-500/20 to-purple-500/20'}`}>
                {therapist.Icon ? <therapist.Icon size={36} /> : therapist.avatar}
              </div>
              
              <div className="flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-1">
                  <h3 className="text-white font-medium text-lg">{therapist.name}</h3>
                  <div className="flex items-center gap-1 text-amber-400 text-xs font-bold bg-amber-500/10 px-2 py-0.5 rounded-full">
                    <Star size={12} fill="currentColor" /> {therapist.rating}
                  </div>
                </div>
                
                <p className="text-sm font-medium text-emerald-400 mb-2">{therapist.specialty}</p>
                <p className="text-sm text-zinc-400 line-clamp-2 mb-3">{therapist.bio}</p>
                
                <div className="mt-auto flex items-center justify-between">
                  <span className="text-xs text-zinc-500 flex items-center gap-1"><MapPin size={12}/> {therapist.location}</span>
                  <button onClick={() => setBookingModal(therapist)}
                    className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium rounded-xl transition-colors shadow-lg shadow-indigo-500/20">
                    Book Now
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Booking Modal */}
      <AnimatePresence>
        {bookingModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setBookingModal(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md max-h-full bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl p-5 sm:p-6 overflow-y-auto flex flex-col">
              
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-white">Book Session</h2>
                <button onClick={() => setBookingModal(null)} className="text-zinc-500 hover:text-white p-1 bg-white/5 rounded-full"><X size={20}/></button>
              </div>

              <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 mb-6 border border-white/5">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center border border-white/5 ${bookingModal.bg || 'bg-white/5'}`}>
                  {bookingModal.Icon ? <bookingModal.Icon size={24} /> : <span className="text-3xl">{bookingModal.avatar}</span>}
                </div>
                <div>
                  <p className="text-white font-medium">{bookingModal.name}</p>
                  <p className="text-xs text-zinc-400">{bookingModal.specialty}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs text-zinc-500 font-medium mb-1.5 block uppercase tracking-wider">Select Date</label>
                  <input type="date" value={selectedDate} onChange={e => { setSelectedDate(e.target.value); setBookingError(''); }}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                    style={{ colorScheme: 'dark' }} />
                </div>
                
                <div>
                  <label className="text-xs text-zinc-500 font-medium mb-1.5 block uppercase tracking-wider">Available Times</label>
                  <div className="grid grid-cols-3 gap-2">
                    {AVAILABLE_TIMES.map(time => (
                      <button key={time} onClick={() => { setSelectedTime(time); setBookingError(''); }}
                        className={`py-2 rounded-lg text-sm font-medium transition-colors border ${
                          selectedTime === time ? 'bg-indigo-500 text-white border-indigo-400' : 'bg-white/5 text-zinc-300 border-white/5 hover:bg-white/10'
                        }`}>
                        {time}
                      </button>
                    ))}
                  </div>
                </div>

                {bookingError && (
                  <p className="text-sm text-rose-400 font-medium text-center bg-rose-500/10 py-2 rounded-lg border border-rose-500/20">
                    {bookingError}
                  </p>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-white/5 flex gap-3 shrink-0">
                <button onClick={() => setBookingModal(null)} className="flex-1 py-3 rounded-xl font-medium text-zinc-300 bg-white/5 hover:bg-white/10 transition-colors">
                  Cancel
                </button>
                <button onClick={handleBook} disabled={booking}
                  className={`flex-1 py-3 rounded-xl font-medium text-white transition-colors flex items-center justify-center gap-2 ${
                    booking ? 'bg-indigo-500 opacity-50' : 'bg-indigo-500 hover:bg-indigo-600'
                  }`}>
                  {booking ? <Loader2 size={18} className="animate-spin" /> : <><CheckCircle size={18}/> Confirm</>}
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Cancel Modal */}
      <AnimatePresence>
        {cancelModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => !cancelling && setCancelModal(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-sm max-h-full bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl p-6 text-center">
              
              <div className="w-16 h-16 rounded-full bg-rose-500/10 flex items-center justify-center mx-auto mb-4 border border-rose-500/20">
                <X size={28} className="text-rose-400" />
              </div>
              
              <h2 className="text-xl font-bold text-white mb-2">Cancel Session</h2>
              <p className="text-sm text-zinc-400 mb-6">Are you sure you want to cancel this appointment? This action cannot be undone.</p>
              
              <div className="flex gap-3">
                <button onClick={() => setCancelModal(null)} disabled={cancelling} className="flex-1 py-3 rounded-xl font-medium text-zinc-300 bg-white/5 hover:bg-white/10 transition-colors disabled:opacity-50">
                  Keep Session
                </button>
                <button onClick={executeCancel} disabled={cancelling}
                  className={`flex-1 py-3 rounded-xl font-medium text-white transition-colors flex items-center justify-center gap-2 ${
                    cancelling ? 'bg-rose-500 opacity-50' : 'bg-rose-500 hover:bg-rose-600'
                  }`}>
                  {cancelling ? <Loader2 size={18} className="animate-spin" /> : 'Yes, Cancel'}
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
