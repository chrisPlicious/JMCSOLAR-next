import type { Metadata } from 'next';
import BookingSplitLayout from './_components/BookingSplitLayout';
import BookingServiceList from './_components/BookingServiceList';

export const metadata: Metadata = {
  title: 'Book a Service — JMC Solar',
  description: 'Book a solar consultation, maintenance service, or site assessment with JMC Solar.',
};

export default function BookingSelectionPage() {
  return (
    <BookingSplitLayout
      leftTag={`BOOKING · ${new Date().getFullYear()}`}
      leftTitle={
        <div className="text-8xl">
          Book a
          <span className="text-solar-600"> Service </span>
        </div>
      }
      leftDescription="A licensed engineering team that designs solar systems specifically for your roof, your bill, and your future."
    >
      <div className="p-8 lg:p-16 max-w-7xl xl:ml-12 lg:min-h-screen flex flex-col">
        <div className="mb-12 pt-8 lg:pt-24" />
        <BookingServiceList />
      </div>
    </BookingSplitLayout>
  );
}