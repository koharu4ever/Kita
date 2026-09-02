import {
  AlignFeature,
  BlockquoteFeature,
  BoldFeature,
  FixedToolbarFeature,
  HeadingFeature,
  HorizontalRuleFeature,
  IndentFeature,
  InlineCodeFeature,
  InlineToolbarFeature,
  ItalicFeature,
  LinkFeature,
  OrderedListFeature,
  ParagraphFeature,
  StrikethroughFeature,
  UnderlineFeature,
  UnorderedListFeature,
  UploadFeature,
  lexicalEditor,
} from "@payloadcms/richtext-lexical";

export const contentEditor = lexicalEditor({
  features: () => [
    ParagraphFeature(),
    HeadingFeature({ enabledHeadingSizes: ["h2", "h3", "h4"] }),
    BoldFeature(),
    ItalicFeature(),
    UnderlineFeature(),
    StrikethroughFeature(),
    InlineCodeFeature(),
    UnorderedListFeature(),
    OrderedListFeature(),
    BlockquoteFeature(),
    LinkFeature({ enabledCollections: ["games", "reviews"], maxDepth: 1 }),
    UploadFeature({
      enabledCollections: ["media"],
      maxDepth: 1,
      collections: {
        media: {
          fields: [
            {
              name: "caption",
              type: "text",
              maxLength: 300,
              admin: {
                description: "Optional caption for this use of the image.",
              },
            },
          ],
        },
      },
    }),
    HorizontalRuleFeature(),
    AlignFeature(),
    IndentFeature(),
    FixedToolbarFeature(),
    InlineToolbarFeature(),
  ],
});
