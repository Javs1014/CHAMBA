
'use client';
import * as React from 'react';
import { cn } from "@/lib/utils"

interface HtmlTemplateDocumentProps {
    template: string;
    replacements: Record<string, string | number>;
    className?: string;
}

export function HtmlTemplateDocument({ template, replacements, className }: HtmlTemplateDocumentProps) {

    const processedHtml = React.useMemo(() => {
        let processed = template;
        for (const key in replacements) {
            const placeholder = `{{${key}}}`;
            // Use a global regex to replace all occurrences
            processed = processed.replace(new RegExp(placeholder, 'g'), String(replacements[key]));
        }
        return processed;
    }, [template, replacements]);

    return (
        <div
            className={cn("html-document-container", className)}
            dangerouslySetInnerHTML={{ __html: processedHtml }}
        />
    );
}
