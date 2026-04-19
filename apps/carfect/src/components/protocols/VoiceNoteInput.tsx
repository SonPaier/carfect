import { useState, useRef, useCallback } from 'react';
import { Mic, MicOff } from 'lucide-react';
import { Button } from '@shared/ui';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

interface VoiceNoteInputProps {
  onTranscript: (text: string) => void;
  disabled?: boolean;
}

export const VoiceNoteInput = ({ onTranscript, disabled = false }: VoiceNoteInputProps) => {
  const { t } = useTranslation();
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const transcriptRef = useRef<string>('');

  const stopRecognition = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsRecording(false);
  }, []);

  const startLiveRecognition = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      toast.error(t('protocols.voice.browserNotSupported'));
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'pl-PL';
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognition.continuous = true;

    transcriptRef.current = '';
    recognitionRef.current = recognition;

    recognition.onstart = () => {
      setIsRecording(true);
      toast.info(t('protocols.voice.listening'));
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = '';
      for (let i = 0; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript + ' ';
        }
      }
      if (finalTranscript) {
        transcriptRef.current = finalTranscript.trim();
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error);
      recognitionRef.current = null;
      setIsRecording(false);
      if (event.error === 'no-speech') {
        toast.error(t('protocols.voice.noSpeech'));
      } else if (event.error === 'not-allowed') {
        toast.error(t('protocols.voice.microphoneBlocked'));
      } else if (event.error !== 'aborted') {
        toast.error(t('protocols.voice.recognitionError'));
      }
    };

    recognition.onend = () => {
      recognitionRef.current = null;
      setIsRecording(false);

      const rawTranscript = transcriptRef.current;
      if (rawTranscript) {
        onTranscript(rawTranscript);
        toast.success(t('protocols.voice.textRecognized'));
      }
    };

    recognition.start();
  }, [onTranscript]);

  const handleClick = () => {
    if (isRecording) {
      stopRecognition();
    } else {
      startLiveRecognition();
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      onClick={handleClick}
      disabled={disabled}
      className={`shrink-0 ${isRecording ? 'bg-red-500/20 border-red-500 text-red-500 hover:bg-red-500/30' : 'bg-white'}`}
      title={isRecording ? t('protocols.voice.stopRecording') : t('protocols.voice.startRecording')}
    >
      {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
    </Button>
  );
};
