import ServiceForm from '../_components/ServiceForm';
import { createService } from '../actions';

export default function NewServicePage() {
  return <ServiceForm action={createService} />;
}
