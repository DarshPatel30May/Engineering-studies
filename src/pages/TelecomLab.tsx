import { Cpu } from 'lucide-react';
import { PageHeader, SectionTitle } from '@/components/ui';
import SectionNav from '@/components/SectionNav';
import { useHashScroll } from '@/hooks/useHashScroll';
import { AnalogueDigital, AMFM, ModDemod, SpectrumExplorer, FibreOptic, TransmissionMedia, ComponentExplorer, Satellites, TVDisplays } from '@/components/telecom/TelecomVisuals';
import { LogicSimulator } from '@/components/telecom/Logic';
import { NetworkFlowLazy } from '@/components/module/TelecomTabs';

const S = [
  { id: 'signals', label: 'Analogue vs digital' },
  { id: 'modulation', label: 'AM / FM' },
  { id: 'spectrum', label: 'Spectrum' },
  { id: 'fibre', label: 'Optical fibre' },
  { id: 'media', label: 'Media' },
  { id: 'components', label: 'Components' },
  { id: 'logic', label: 'Logic gates' },
  { id: 'satellites', label: 'Satellites' },
  { id: 'network', label: 'Network flow' },
  { id: 'displays', label: 'TV displays' },
];

export default function TelecomLab() {
  useHashScroll();
  return (
    <div>
      <PageHeader title="Telecommunications Laboratory" kicker="Module 4 interactive tools" accent="telecom" icon={<Cpu className="text-telecom" />}>
        Signals, modulation, the spectrum, fibre optics, semiconductor components, digital logic and satellite systems — all interactive.
      </PageHeader>
      <SectionNav items={S} />
      <div className="space-y-8">
        <section id="signals" className="scroll-mt-28"><SectionTitle>Analogue versus digital</SectionTitle><AnalogueDigital /></section>
        <section id="modulation" className="scroll-mt-28 space-y-4"><SectionTitle>AM, FM, modulation and demodulation</SectionTitle><AMFM /><ModDemod /></section>
        <section id="spectrum" className="scroll-mt-28"><SectionTitle>Electromagnetic spectrum explorer</SectionTitle><SpectrumExplorer /></section>
        <section id="fibre" className="scroll-mt-28"><SectionTitle>Optical fibre propagation</SectionTitle><FibreOptic /></section>
        <section id="media" className="scroll-mt-28"><SectionTitle>Transmission media comparison</SectionTitle><TransmissionMedia /></section>
        <section id="components" className="scroll-mt-28"><SectionTitle>LED, laser diode, transistor and Zener explorer</SectionTitle><ComponentExplorer /></section>
        <section id="logic" className="scroll-mt-28"><SectionTitle>Logic gate simulator and truth tables</SectionTitle><LogicSimulator /></section>
        <section id="satellites" className="scroll-mt-28"><SectionTitle>Satellite communication: GEO vs LEO, GPS</SectionTitle><Satellites /></section>
        <section id="network" className="scroll-mt-28"><SectionTitle>Network flow</SectionTitle><NetworkFlowLazy /></section>
        <section id="displays" className="scroll-mt-28"><SectionTitle>Television display technologies</SectionTitle><TVDisplays /></section>
      </div>
    </div>
  );
}
