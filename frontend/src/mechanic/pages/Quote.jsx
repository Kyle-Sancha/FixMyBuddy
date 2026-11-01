import { useNavigate, useParams } from 'react-router-dom';
import { QuoteEditor } from '../components/QuoteEditor';

export function Quote() {
  const navigate = useNavigate();
  const { jobId } = useParams();

  function handleQuoteAction(value) {
    if (value.items) {
      navigate(`/mechanic/jobs/${jobId || 'FMB-1042'}/additional-work`);
    }
  }

  return (
    <div className="pb-4">
      <div className="mb-4">
        <h1 className="m-0 text-xl font-bold">Build a clear quote</h1>
        <p className="mb-0 mt-1 text-xs text-[#aebbd0]">
          {jobId || 'FMB-1042'} · Quote v1 · Draft, not approved
        </p>
      </div>

      <QuoteEditor
        onSubmit={handleQuoteAction}
      />
    </div>
  );
}
