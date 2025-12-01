import { useDonations } from '../context/DonationContext';
import DonationAlert from './DonationAlert';

export default function DonationOverlay() {
  const { currentDonation, clearCurrentDonation } = useDonations();
  
  return (
    <DonationAlert 
      donation={currentDonation} 
      onComplete={clearCurrentDonation} 
    />
  );
}