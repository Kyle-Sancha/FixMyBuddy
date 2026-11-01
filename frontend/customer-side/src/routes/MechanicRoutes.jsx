import { Navigate, Route, Routes } from 'react-router-dom';

import { MechanicLayout } from '../../../src/mechanic/layout/MechanicLayout';
import { Welcome } from '../../../src/mechanic/pages/Welcome';
import { SignIn } from '../../../src/mechanic/pages/SignIn';
import { Availability } from '../../../src/mechanic/pages/Availability';
import { Jobs } from '../../../src/mechanic/pages/Jobs';
import { JobOffer } from '../../../src/mechanic/pages/JobOffer';
import { JobTravel } from '../../../src/mechanic/pages/JobTravel';
import { VerifyArrival } from '../../../src/mechanic/pages/VerifyArrival';
import { Diagnosis } from '../../../src/mechanic/pages/Diagnosis';
import { Quote } from '../../../src/mechanic/pages/Quote';
import { AdditionalWork } from '../../../src/mechanic/pages/AdditionalWork';
import { RepairProgress } from '../../../src/mechanic/pages/RepairProgress';
import { TowingHandover } from '../../../src/mechanic/pages/TowingHandover';
import { JobComplete } from '../../../src/mechanic/pages/JobComplete';
import { Earnings } from '../../../src/mechanic/pages/Earnings';
import { Updates } from '../../../src/mechanic/pages/Updates';
import { Account } from '../../../src/mechanic/pages/Account';
import { NotFound } from '../pages/NotFound';

export function MechanicRoutes() {
  return (
    <Routes>
      <Route index element={<Welcome />} />
      <Route path="sign-in" element={<SignIn />} />

      <Route element={<MechanicLayout />}>
        <Route path="availability" element={<Availability />} />
        <Route path="jobs" element={<Jobs />} />
        <Route path="jobs/:jobId" element={<JobOffer />} />
        <Route path="jobs/:jobId/travel" element={<JobTravel />} />
        <Route path="jobs/:jobId/arrival" element={<VerifyArrival />} />
        <Route path="jobs/:jobId/diagnosis" element={<Diagnosis />} />
        <Route path="jobs/:jobId/quote" element={<Quote />} />
        <Route path="jobs/:jobId/additional-work" element={<AdditionalWork />} />
        <Route path="jobs/:jobId/progress" element={<RepairProgress />} />
        <Route path="jobs/:jobId/handover" element={<TowingHandover />} />
        <Route path="jobs/:jobId/complete" element={<JobComplete />} />
        <Route path="earnings" element={<Earnings />} />
        <Route path="updates" element={<Updates />} />
        <Route path="account" element={<Account />} />
        <Route index element={<Navigate to="jobs" replace />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
