import type { Schema, Struct } from '@strapi/strapi';

export interface ServiceBrief extends Struct.ComponentSchema {
  collectionName: 'components_service_briefs';
  info: {
    description: 'The small brief card shown on the service hero.';
    displayName: 'Brief card';
    icon: 'file';
  };
  attributes: {
    label: Schema.Attribute.String;
    status: Schema.Attribute.String;
    tag: Schema.Attribute.String;
    title: Schema.Attribute.String & Schema.Attribute.Required;
    value: Schema.Attribute.String;
  };
}

export interface SharedHeadline extends Struct.ComponentSchema {
  collectionName: 'components_shared_headlines';
  info: {
    description: 'Detail-page title: the lead words, then the words set in the accent style.';
    displayName: 'Headline';
    icon: 'heading';
  };
  attributes: {
    accent: Schema.Attribute.String;
    lead: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface SharedQuote extends Struct.ComponentSchema {
  collectionName: 'components_shared_quotes';
  info: {
    description: 'Client quote with its author.';
    displayName: 'Quote';
    icon: 'quote';
  };
  attributes: {
    authorName: Schema.Attribute.String;
    authorPhoto: Schema.Attribute.Media<'images'>;
    authorRole: Schema.Attribute.String;
    text: Schema.Attribute.Text & Schema.Attribute.Required;
  };
}

export interface SharedSeo extends Struct.ComponentSchema {
  collectionName: 'components_shared_seos';
  info: {
    description: 'Optional overrides for the page title and meta description.';
    displayName: 'SEO';
    icon: 'search';
  };
  attributes: {
    metaDescription: Schema.Attribute.Text;
    metaTitle: Schema.Attribute.String;
  };
}

export interface SharedStat extends Struct.ComponentSchema {
  collectionName: 'components_shared_stats';
  info: {
    description: 'A key figure with its label.';
    displayName: 'Stat';
    icon: 'chartBubble';
  };
  attributes: {
    label: Schema.Attribute.String & Schema.Attribute.Required;
    value: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface SharedStatement extends Struct.ComponentSchema {
  collectionName: 'components_shared_statements';
  info: {
    description: 'A sentence with one highlighted phrase (start + accent + end).';
    displayName: 'Statement';
    icon: 'quote';
  };
  attributes: {
    accent: Schema.Attribute.String;
    end: Schema.Attribute.Text;
    start: Schema.Attribute.Text & Schema.Attribute.Required;
  };
}

export interface SharedTextItem extends Struct.ComponentSchema {
  collectionName: 'components_shared_text_items';
  info: {
    description: 'One line of text (tags, takeaways).';
    displayName: 'Text item';
    icon: 'bulletList';
  };
  attributes: {
    text: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface SharedTitledText extends Struct.ComponentSchema {
  collectionName: 'components_shared_titled_texts';
  info: {
    description: 'A title with a paragraph (article sections, challenges).';
    displayName: 'Titled text';
    icon: 'feather';
  };
  attributes: {
    text: Schema.Attribute.Text & Schema.Attribute.Required;
    title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

declare module '@strapi/strapi' {
  export namespace Public {
    export interface ComponentSchemas {
      'service.brief': ServiceBrief;
      'shared.headline': SharedHeadline;
      'shared.quote': SharedQuote;
      'shared.seo': SharedSeo;
      'shared.stat': SharedStat;
      'shared.statement': SharedStatement;
      'shared.text-item': SharedTextItem;
      'shared.titled-text': SharedTitledText;
    }
  }
}
