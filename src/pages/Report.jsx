import { useNavigate } from 'react-router-dom';
import ReportForm from '../components/Report/ReportForm';

export default function Report() {
  const navigate = useNavigate();

  return (
    <div className="page">
      <div className="form-page">
        <h1>📷 Report an Issue</h1>
        <p className="subtitle">
          Take a photo of a civic problem in your area. Our AI will analyze it and file a report on the nation-wide map.
        </p>
        <ReportForm onSuccess={() => navigate('/')} />
      </div>
    </div>
  );
}