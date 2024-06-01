"use client";
import React, { useState, useEffect, useRef } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { okaidia } from "@uiw/codemirror-theme-okaidia";
import { dracula } from "@uiw/codemirror-theme-dracula";
import { inlineCopilot } from "codemirror-copilot";
import { keymap } from "@codemirror/view";
import { defaultKeymap } from "@codemirror/commands";
import CommandPalette from "@/components/CommandPalette";

const Editor = ({ value, onChange, editorTheme }) => {
	const editorRefs = useRef();
	const paletteRef = useRef();
	const [isPaletteVisible, setIsPaletteVisible] = useState(false);
	window.editor = editorRefs;
	const openCommandPalette = () => {
		setIsPaletteVisible(true);
		return true;
	};
	const commandPaletteKeyBind = {
		key: "Ctrl-Alt-p",
		preventDefault: true,
		run: openCommandPalette
	};
	const keybindings = [
		...defaultKeymap.map(binding => ({
			key: binding.key,
			name: binding.run.name,
			run: binding.run
		})),
		commandPaletteKeyBind
	];

	useEffect(() => {
		const handleClickOutside = event => {
			if (paletteRef.current && !paletteRef.current.contains(event.target)) {
				setIsPaletteVisible(false)
			}
		};

		document.addEventListener("mousedown", handleClickOutside);
		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, [paletteRef]);

	const handleCommandSelect = command => {
		if (command && typeof command.run === "function") {
			command.run(editorRefs.current.view);
			setIsPaletteVisible(false);
		}
	};

	return (
		<div className="flex-1 overflow-auto">
			<CodeMirror
				ref={editorRefs}
				value={value}
				theme={editorTheme || dracula}
				height="100%"
				extensions={[
					keymap.of([commandPaletteKeyBind, ...defaultKeymap]),
					javascript({ jsx: true }),
					inlineCopilot(
						async (prefix, suffix) => {
							const res = await fetch("/api/copilot", {
								method: "POST",
								headers: {
									"Content-Type": "application/json"
								},
								body: JSON.stringify({
									prefix,
									suffix,
									language: "javascript",
									model: "hf/meta-llama/meta-llama-3-8b-instruct"
								})
							});
							const { prediction } = await res.json();
							return prediction;
						},
						500,
						true
					)
				]}
				editorDidMount={editor => {
					editor.setSize("", "100%");
				}}
				onChange={value => onChange(value)}
				style={{ height: "100%" }}
			/>
			<div ref={paletteRef}>
				<CommandPalette
					open={isPaletteVisible}
					keybindings={keybindings}
					onCommandSelect={handleCommandSelect}
				/>
			</div>
		</div>
	);
};

export default Editor;
