import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Camera, RefreshCcw } from 'lucide-react';
import { Html5Qrcode, CameraDevice } from 'html5-qrcode';
import { useLanguage } from '../contexts/LanguageContext';

interface ScannerModalProps {
    onClose: () => void;
    onScan: (val: string) => void;
}

export const ScannerModal: React.FC<ScannerModalProps> = ({ onClose, onScan }) => {
    const { t } = useLanguage();
    const [permissionError, setPermissionError] = useState(false);
    const [cameras, setCameras] = useState<CameraDevice[]>([]);
    const [selectedCameraId, setSelectedCameraId] = useState<string | null>(null);
    const html5QrCodeRef = useRef<Html5Qrcode | null>(null);

    useEffect(() => {
        // Initialize HTML5 QR Code instance
        html5QrCodeRef.current = new Html5Qrcode("reader");

        // Request camera permissions and get list of available cameras
        Html5Qrcode.getCameras().then(devices => {
            if (devices && devices.length) {
                setCameras(devices);

                // Advanced Heuristic to find the main 1x back camera
                // 1. Filter to only Back / Rear cameras
                const backCameras = devices.filter(c =>
                    c.label.toLowerCase().includes('back') ||
                    c.label.toLowerCase().includes('rear') ||
                    c.label.toLowerCase().includes('environment')
                );

                let selectedId = devices[devices.length - 1].id; // Fallback to last device

                if (backCameras.length > 0) {
                    // 2. Try to avoid Ultra-Wide and Telephoto
                    const standardBack = backCameras.find(c => {
                        const lbl = c.label.toLowerCase();
                        const isWide = lbl.includes('wide') && !lbl.includes('ultra'); // Sometimes main is just "Wide"
                        const isUltraWide = lbl.includes('ultra-wide') || lbl.includes('ultrawide');
                        const isTele = lbl.includes('tele') || lbl.includes('depth');
                        return !isUltraWide && !isTele && (isWide || lbl.includes('lens 0') || lbl.includes('0'));
                    });

                    // 3. Fallback to first back camera if no clear "standard" label is found
                    selectedId = standardBack ? standardBack.id : backCameras[0].id;
                }

                setSelectedCameraId(selectedId);
                startScanner(selectedId);
            } else {
                setPermissionError(true);
            }
        }).catch(err => {
            console.error("Error getting cameras", err);
            setPermissionError(true);
        });

        return () => {
            if (html5QrCodeRef.current?.isScanning) {
                html5QrCodeRef.current.stop().catch(err => console.error("Failed to stop scanner on unmount", err));
            }
        };
    }, []);

    const startScanner = (cameraId: string) => {
        if (!html5QrCodeRef.current) return;

        // Stop existing scan before starting a new one
        if (html5QrCodeRef.current.isScanning) {
            html5QrCodeRef.current.stop().then(() => {
                startScanningWithId(cameraId);
            }).catch(console.error);
        } else {
            startScanningWithId(cameraId);
        }
    };

    const startScanningWithId = (cameraId: string) => {
        const config = { fps: 10, qrbox: { width: 250, height: 250 } };

        html5QrCodeRef.current?.start(
            cameraId,
            config,
            (decodedText) => {
                onScan(decodedText);
                html5QrCodeRef.current?.stop().catch(err => console.error("Failed to stop scanner", err));
            },
            (errorMessage) => {
                // Ignore parse errors (happens every frame until a code is found)
            }
        ).catch(err => {
            console.error("Error starting scanner", err);
            setPermissionError(true);
        });
    }

    const switchCamera = () => {
        if (cameras.length <= 1 || !selectedCameraId) return;
        const currentIndex = cameras.findIndex(c => c.id === selectedCameraId);
        const nextIndex = (currentIndex + 1) % cameras.length;
        const nextCameraId = cameras[nextIndex].id;

        setSelectedCameraId(nextCameraId);
        startScanner(nextCameraId);
    };

    return createPortal(
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/90 p-4 animate-fade-in">
            <div className="bg-white dark:bg-[#1c1c1e] rounded-3xl p-6 w-full max-w-md shadow-2xl relative flex flex-col items-center border border-gray-100 dark:border-[#333]">
                <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-gray-100 dark:bg-[#2c2c2e] rounded-full hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/30 transition-colors z-10"><X className="w-5 h-5 dark:text-white" /></button>

                <div className="w-full flex items-center justify-between mb-4 mt-2">
                    <h3 className="text-xl font-bold flex items-center gap-2 text-[#1d1d1f] dark:text-white">
                        <Camera className="w-5 h-5 text-blue-500" />
                        {t('modals.scanTitle')}
                    </h3>

                    {cameras.length > 1 && (
                        <button
                            onClick={switchCamera}
                            className="flex items-center gap-1.5 px-3 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg text-xs font-bold hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors shadow-sm max-w-[200px]"
                            title="สลับกล้อง"
                        >
                            <RefreshCcw className="w-3.5 h-3.5 flex-shrink-0" />
                            <span className="truncate">
                                {cameras.find(c => c.id === selectedCameraId)?.label?.replace(/camera|lens|facing|back|rear/gi, '').trim() || `เลนส์ ${cameras.findIndex(c => c.id === selectedCameraId) + 1}`}
                            </span>
                        </button>
                    )}
                </div>

                <div className="w-full overflow-hidden rounded-2xl border-4 border-[#0071e3]/30 relative bg-black aspect-square shadow-inner">
                    <div id="reader" className="w-full h-full"></div>
                    {/* Scanning overlay guide line */}
                    <div className="absolute top-1/2 left-8 right-8 h-0.5 bg-red-500/50 shadow-[0_0_8px_rgba(239,68,68,0.8)] -translate-y-1/2 animate-pulse"></div>
                </div>

                <p className="text-xs text-gray-400 mt-4 text-center">หันกล้องไปที่บาร์โค้ด หรือ QR Code <br />ระบบจะสแกนอัตโนมัติ</p>

                {permissionError ? (
                    <p className="text-red-500 text-sm mt-4 text-center font-medium bg-red-50 dark:bg-red-900/20 p-3 rounded-xl">{t('modals.cameraError')} / กรุณาอนุญาตให้ใช้งานกล้อง</p>
                ) : null}
            </div>
        </div>,
        document.body
    );
};
