import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from "react-router";
import { generate3DView } from "../../lib/ai.action";
import { Box, Download, RefreshCcw, Share2, X } from "lucide-react";
import Button from "../../components/ui/Button";

const VisualizerId = () => {
    const navigate = useNavigate();
    const location = useLocation();

    // 1. Destructure carefully. Note: initialRender was causing a ReferenceError before.
    const { initialImage, initialRender, name } = location.state || {};

    const hasInitialGenerated = useRef(false);
    const [mounted, setMounted] = useState(false); // Fix for Hydration
    const [isProcessing, setIsProcessing] = useState(false);

    // Initialize state to null to match Server output initially
    const [currentImage, setCurrentImage] = useState<string | null>(null);

    const handleBack = () => navigate('/');

    const runGeneration = async () => {
        if (!initialImage) return;
        try {
            setIsProcessing(true);
            const result = await generate3DView({ sourceImage: initialImage });
            if (result.renderedImage) {
                setCurrentImage(result.renderedImage);
            }
        } catch (error) {
            console.error('Generation failed:', error);
        } finally {
            setIsProcessing(false);
        }
    };

    // 2. Handle mounting and initial state sync
    useEffect(() => {
        setMounted(true);
        if (initialRender) {
            setCurrentImage(initialRender);
        }
    }, [initialRender]);

    // 3. Handle Auto-generation logic
    useEffect(() => {
        // Only run if mounted, we have an image, we haven't generated yet,
        // and we don't already have a rendered result.
        if (mounted && initialImage && !initialRender && !hasInitialGenerated.current) {
            hasInitialGenerated.current = true;
            runGeneration();
        }
    }, [mounted, initialImage, initialRender]);

    // 4. If not mounted, render a "shell" that matches the Server's empty state
    if (!mounted) {
        return <div className="visualizer" />;
    }

    return (
        <div className="visualizer">
            <nav className="topbar">
                <div className="brand">
                    <Box className="logo" />
                    <span className="name">Roomify</span>
                </div>
                <Button variant="ghost" size="sm" onClick={handleBack} className="exit">
                    <X className="icon"/> Exit Editor
                </Button>
            </nav>

            <section className="content">
                <div className="panel">
                    <div className="panel-header">
                        <div className="panel-meta">
                            <p>Project</p>
                            <h2>{name || 'Untitled Project'}</h2>
                            <p className="note">Created by you</p>
                        </div>
                        <div className="panel-actions">
                            <Button
                                size="sm"
                                onClick={() => {}}
                                className="export"
                                disabled={!currentImage}
                            >
                                <Download className="w-4 h-4 mr-2" /> Export
                            </Button>
                            <Button size="sm" onClick={() => {}} className="share">
                                <Share2 className="w-4 h-4 mr-2" />
                                Share
                            </Button>
                        </div>
                    </div>

                    <div className={`render-area ${isProcessing ? 'is-processing': ''}`}>
                        {currentImage ? (
                            <img src={currentImage} alt="AI Render" className="render-img" />
                        ) : (
                            <div className="render-placeholder">
                                {initialImage && (
                                    <img src={initialImage} alt="Original" className="render-fallback" />
                                )}
                            </div>
                        )}

                        {isProcessing && (
                            <div className="render-overlay">
                                <div className="rendering-card">
                                    <RefreshCcw className="spinner" />
                                    <span className="title">Rendering...</span>
                                    <span className="subtitle">Generating your 3D visualization</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </section>
        </div>
    );
};

export default VisualizerId;