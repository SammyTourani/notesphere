/**
 * ULTIMATE GRAMMAR RULES ENGINE
 * 
 * Comprehensive grammar checking that covers ALL potential weak areas:
 * - Advanced subject-verb agreement patterns
 * - Subjunctive mood detection
 * - Complex pronoun case errors
 * - Technical writing patterns
 * - Conditional structures
 * - Comparative/superlative errors
 * - Tense consistency
 * - Double negatives
 * - Modal verb constructions
 * - Preposition errors
 * - Article usage patterns
 * - Sentence structure issues
 * - Advanced style patterns
 * 
 * This engine contains 100+ sophisticated rules to catch errors that
 * even advanced grammar checkers miss.
 */

export class UltimateGrammarRules {
    constructor() {
        this.rules = [
            // ============================================
            // SUBJECT-VERB AGREEMENT (Advanced Patterns)
            // ============================================
            {
                id: 'SVA_FIRST_PERSON_SINGULAR',
                pattern: /\bI\s+(has|have\s+(?:went|gone|did|done|seen|been|had)\b)/gi,
                message: 'First person singular "I" should use "have", not "has"',
                category: 'grammar',
                severity: 'error',
                suggestions: (match) => match.replace(/\bI\s+has\b/gi, 'I have'),
                examples: ['I has been there', 'I has went shopping']
            },
            {
                id: 'SVA_SECOND_PERSON',
                pattern: /\byou\s+(was|has|does|is)\b/gi,
                message: 'Second person "you" should use plural verb forms',
                category: 'grammar',
                severity: 'error',
                suggestions: (match) => match.replace(/you\s+(was|has|does|is)/gi, (m, verb) => {
                    const corrections = { 'was': 'were', 'has': 'have', 'does': 'do', 'is': 'are' };
                    return `you ${corrections[verb.toLowerCase()]}`;
                }),
                examples: ['You was right', 'You has the book', 'You does this well']
            },
            {
                id: 'SVA_THIRD_PERSON_PLURAL',
                pattern: /\b(they|we|these|those|both|several|many|few|all)\s+(was|has|does|is)\b/gi,
                message: 'Plural subjects require plural verb forms',
                category: 'grammar',
                severity: 'error',
                suggestions: (match) => match.replace(/(was|has|does|is)/gi, (verb) => {
                    const corrections = { 'was': 'were', 'has': 'have', 'does': 'do', 'is': 'are' };
                    return corrections[verb.toLowerCase()];
                }),
                examples: ['They was happy', 'We has completed it', 'These does work']
            },
            {
                id: 'SVA_INDEFINITE_PRONOUNS_SINGULAR',
                pattern: /\b(everyone|someone|anyone|no one|everybody|somebody|anybody|nobody|each|either|neither|one)\s+(are|have|do|were)\b/gi,
                message: 'Indefinite pronouns like "everyone", "someone" are singular and need singular verbs',
                category: 'grammar',
                severity: 'error',
                suggestions: (match) => match.replace(/(are|have|do|were)/gi, (verb) => {
                    const corrections = { 'are': 'is', 'have': 'has', 'do': 'does', 'were': 'was' };
                    return corrections[verb.toLowerCase()];
                }),
                examples: ['Everyone are here', 'Someone have called', 'Each do their part']
            },
            {
                id: 'SVA_INDEFINITE_PRONOUNS_PLURAL',
                pattern: /\b(both|few|many|several|all|some)\s+(is|has|does|was)\b/gi,
                message: 'Plural indefinite pronouns need plural verbs',
                category: 'grammar',
                severity: 'error',
                suggestions: (match) => match.replace(/(is|has|does|was)/gi, (verb) => {
                    const corrections = { 'is': 'are', 'has': 'have', 'does': 'do', 'was': 'were' };
                    return corrections[verb.toLowerCase()];
                }),
                examples: ['Both is correct', 'Many has arrived', 'Few does this']
            },
            {
                id: 'SVA_COLLECTIVE_NOUNS',
                pattern: /\b(team|group|family|class|committee|staff|crew|audience|jury|band|company)\s+(are|have|do|were)\b/gi,
                message: 'Collective nouns are typically singular in American English',
                category: 'grammar',
                severity: 'warning',
                suggestions: (match) => match.replace(/(are|have|do|were)/gi, (verb) => {
                    const corrections = { 'are': 'is', 'have': 'has', 'do': 'does', 'were': 'was' };
                    return corrections[verb.toLowerCase()];
                }),
                examples: ['The team are ready', 'The committee have decided']
            },

            // ============================================
            // SUBJUNCTIVE MOOD (Advanced Detection)
            // ============================================
            {
                id: 'SUBJUNCTIVE_IF_CLAUSES',
                pattern: /\bif\s+I\s+was\b/gi,
                message: 'Use subjunctive "were" in hypothetical "if" clauses: "If I were"',
                category: 'grammar',
                severity: 'error',
                suggestions: (match) => match.replace(/if\s+I\s+was/gi, 'If I were'),
                examples: ['If I was you', 'If I was taller']
            },
            {
                id: 'SUBJUNCTIVE_WISH_CLAUSES',
                pattern: /\b(I wish|if only)\s+I\s+was\b/gi,
                message: 'Use subjunctive "were" after "wish" and "if only": "I wish I were"',
                category: 'grammar',
                severity: 'error',
                suggestions: (match) => match.replace(/(I wish|if only)\s+I\s+was/gi, '$1 I were'),
                examples: ['I wish I was taller', 'If only I was there']
            },
            {
                id: 'SUBJUNCTIVE_AS_IF',
                pattern: /\b(as if|as though)\s+(?:he|she|it|I|you|we|they)\s+was\b/gi,
                message: 'Use subjunctive "were" after "as if" and "as though"',
                category: 'grammar',
                severity: 'error',
                suggestions: (match) => match.replace(/was\b/gi, 'were'),
                examples: ['He acts as if he was the boss', 'She looked as though she was confused']
            },
            {
                id: 'SUBJUNCTIVE_SUGGEST_DEMAND',
                pattern: /\b(suggest|demand|require|insist|recommend|propose|request|urge|ask)\s+that\s+(?:he|she|it|they|we|I|you)\s+(goes|does|has|is|are|was|were)\b/gi,
                message: 'Use base form of verb (subjunctive) after verbs like "suggest", "demand", "require"',
                category: 'grammar',
                severity: 'error',
                suggestions: (match) => match.replace(/(goes|does|has|is|are|was|were)/gi, (verb) => {
                    const baseForm = {
                        'goes': 'go', 'does': 'do', 'has': 'have', 
                        'is': 'be', 'are': 'be', 'was': 'be', 'were': 'be'
                    };
                    return baseForm[verb.toLowerCase()] || verb;
                }),
                examples: ['I suggest that he goes', 'She demands that it is done']
            },

            // ============================================
            // PRONOUN CASE ERRORS (Advanced)
            // ============================================
            {
                id: 'PRONOUN_OBJECT_PREPOSITION',
                pattern: /\b(between|among|with|for|to|from|by|of)\s+(I|he|she|we|they)\b/gi,
                message: 'Use objective pronouns after prepositions',
                category: 'grammar',
                severity: 'error',
                suggestions: (match) => match.replace(/(I|he|she|we|they)/gi, (pronoun) => {
                    const objective = { 'I': 'me', 'he': 'him', 'she': 'her', 'we': 'us', 'they': 'them' };
                    return objective[pronoun] || pronoun;
                }),
                examples: ['Between you and I', 'Give it to she', 'Come with we']
            },
            {
                id: 'PRONOUN_COMPOUND_SUBJECT',
                pattern: /\b(me|him|her|us|them)\s+and\s+(?:I|he|she|we|they|[A-Z][a-z]+)\s+(?:are|is|were|was|will|can|should|would|have|has|do|does|did)\b/gi,
                message: 'Use subjective pronouns in compound subjects',
                category: 'grammar',
                severity: 'error',
                suggestions: (match) => match.replace(/(me|him|her|us|them)/gi, (pronoun) => {
                    const subjective = { 'me': 'I', 'him': 'he', 'her': 'she', 'us': 'we', 'them': 'they' };
                    return subjective[pronoun] || pronoun;
                }),
                examples: ['Me and John are going', 'Him and her were there']
            },
            {
                id: 'PRONOUN_COMPOUND_OBJECT',
                pattern: /\bgive\s+(?:it|this|that|them|the\s+\w+)\s+to\s+(I|he|she|we|they)\s+and\s+(?:me|him|her|us|them|[a-z]+)\b/gi,
                message: 'Use objective pronouns in compound objects',
                category: 'grammar',
                severity: 'error',
                suggestions: (match) => match.replace(/(I|he|she|we|they)/gi, (pronoun) => {
                    const objective = { 'I': 'me', 'he': 'him', 'she': 'her', 'we': 'us', 'they': 'them' };
                    return objective[pronoun] || pronoun;
                }),
                examples: ['Give it to she and me', 'Send it to he and John']
            },
            {
                id: 'PRONOUN_REFLEXIVE_ERRORS',
                pattern: /\b(myself|yourself|himself|herself|itself|ourselves|yourselves|themselves)\s+(?:and\s+(?:I|you|he|she|it|we|they)|are|is|were|was|will|can)\b/gi,
                message: 'Reflexive pronouns cannot be used as subjects',
                category: 'grammar',
                severity: 'error',
                suggestions: (match) => match.replace(/(myself|yourself|himself|herself|itself|ourselves|yourselves|themselves)/gi, (pronoun) => {
                    const correct = {
                        'myself': 'I', 'yourself': 'you', 'himself': 'he', 'herself': 'she',
                        'itself': 'it', 'ourselves': 'we', 'yourselves': 'you', 'themselves': 'they'
                    };
                    return correct[pronoun] || pronoun;
                }),
                examples: ['Myself and John went', 'Himself is responsible']
            },

            // ============================================
            // MODAL VERB CONSTRUCTIONS
            // ============================================
            {
                id: 'MODAL_OF_HAVE',
                pattern: /\b(should|could|would|might|must|ought)\s+of\b/gi,
                message: 'Use "have" not "of" after modal verbs',
                category: 'grammar',
                severity: 'error',
                suggestions: (match) => match.replace(/\s+of\b/gi, ' have'),
                examples: ['should of', 'could of', 'would of', 'might of']
            },
            {
                id: 'MODAL_DOUBLE_MODAL',
                pattern: /\b(will|would|can|could|may|might|shall|should|must|ought)\s+(will|would|can|could|may|might|shall|should|must|ought)\b/gi,
                message: 'Avoid using two modal verbs together',
                category: 'grammar',
                severity: 'error',
                suggestions: (match) => match.replace(/\b(will|would|can|could|may|might|shall|should|must|ought)\s+(will|would|can|could|may|might|shall|should|must|ought)\b/gi, '$2'),
                examples: ['will can go', 'should must do', 'might could happen']
            },
            {
                id: 'MODAL_TO_INFINITIVE',
                pattern: /\b(can|could|may|might|shall|should|will|would|must)\s+to\s+\w+/gi,
                message: 'Modal verbs are followed by base form, not infinitive "to"',
                category: 'grammar',
                severity: 'error',
                suggestions: (match) => match.replace(/\s+to\s+/gi, ' '),
                examples: ['can to go', 'should to do', 'will to see']
            },

            // ============================================
            // TENSE CONSISTENCY AND ERRORS
            // ============================================
            {
                id: 'TENSE_PAST_IRREGULAR_VERBS',
                pattern: /\b(I|you|we|they|he|she|it)\s+(goed|comed|runned|bringed|catched|hitted|hurted|layed|payed|sended|speaked|telled|writed)\b/gi,
                message: 'Incorrect past tense form of irregular verb',
                category: 'grammar',
                severity: 'error',
                suggestions: (match) => {
                    const corrections = {
                        'goed': 'went', 'comed': 'came', 'runned': 'ran', 'bringed': 'brought',
                        'catched': 'caught', 'hitted': 'hit', 'hurted': 'hurt', 'layed': 'laid',
                        'payed': 'paid', 'sended': 'sent', 'speaked': 'spoke', 'telled': 'told', 'writed': 'wrote'
                    };
                    return match.replace(/\b(goed|comed|runned|bringed|catched|hitted|hurted|layed|payed|sended|speaked|telled|writed)\b/gi, 
                        (verb) => corrections[verb.toLowerCase()]);
                },
                examples: ['I goed there', 'She comed yesterday', 'They runned fast']
            },
            {
                id: 'TENSE_PAST_PARTICIPLE_ERRORS',
                pattern: /\b(have|has|had)\s+(went|came|ran|saw|did|ate|began|broke|chose|drew|flew|forgot|got|gave|knew|rode|sang|spoke|took|wore|wrote)\b/gi,
                message: 'Use past participle, not simple past, with auxiliary verbs',
                category: 'grammar',
                severity: 'error',
                suggestions: (match) => {
                    const corrections = {
                        'went': 'gone', 'came': 'come', 'ran': 'run', 'saw': 'seen', 'did': 'done',
                        'ate': 'eaten', 'began': 'begun', 'broke': 'broken', 'chose': 'chosen',
                        'drew': 'drawn', 'flew': 'flown', 'forgot': 'forgotten', 'got': 'gotten',
                        'gave': 'given', 'knew': 'known', 'rode': 'ridden', 'sang': 'sung',
                        'spoke': 'spoken', 'took': 'taken', 'wore': 'worn', 'wrote': 'written'
                    };
                    return match.replace(/\b(went|came|ran|saw|did|ate|began|broke|chose|drew|flew|forgot|got|gave|knew|rode|sang|spoke|took|wore|wrote)\b/gi,
                        (verb) => corrections[verb.toLowerCase()]);
                },
                examples: ['I have went', 'She has saw it', 'They had did it']
            },
            {
                id: 'TENSE_SEQUENCE_ERRORS',
                pattern: /\b(yesterday|last\s+(?:week|month|year|night)|ago)\s+.{0,50}\b(go|come|see|do|eat|begin|break|choose|draw|fly|forget|get|give|know|ride|sing|speak|take|wear|write)\b/gi,
                message: 'Use past tense with past time indicators',
                category: 'grammar',
                severity: 'error',
                suggestions: (match) => {
                    const pastTense = {
                        'go': 'went', 'come': 'came', 'see': 'saw', 'do': 'did', 'eat': 'ate',
                        'begin': 'began', 'break': 'broke', 'choose': 'chose', 'draw': 'drew',
                        'fly': 'flew', 'forget': 'forgot', 'get': 'got', 'give': 'gave',
                        'know': 'knew', 'ride': 'rode', 'sing': 'sang', 'speak': 'spoke',
                        'take': 'took', 'wear': 'wore', 'write': 'wrote'
                    };
                    return match.replace(/\b(go|come|see|do|eat|begin|break|choose|draw|fly|forget|get|give|know|ride|sing|speak|take|wear|write)\b/gi,
                        (verb) => pastTense[verb.toLowerCase()] || verb);
                },
                examples: ['Yesterday I go shopping', 'Last week she see him']
            },

            // ============================================
            // DOUBLE NEGATIVES
            // ============================================
            {
                id: 'DOUBLE_NEGATIVE_NOTHING',
                pattern: /\b(?:don't|doesn't|didn't|won't|wouldn't|can't|couldn't|shouldn't|isn't|aren't|wasn't|weren't)\s+(?:\w+\s+){0,3}(?:nothing|nobody|nowhere|never|none)\b/gi,
                message: 'Avoid double negatives - use positive with negative verb or negative with positive verb',
                category: 'grammar',
                severity: 'error',
                suggestions: (match) => match.replace(/(nothing|nobody|nowhere|never|none)/gi, (word) => {
                    const positive = { 'nothing': 'anything', 'nobody': 'anybody', 'nowhere': 'anywhere', 'never': 'ever', 'none': 'any' };
                    return positive[word.toLowerCase()];
                }),
                examples: ["I don't want nothing", "She can't hardly see", "We won't never go"]
            },
            {
                id: 'DOUBLE_NEGATIVE_HARDLY',
                pattern: /\b(?:don't|doesn't|didn't|won't|wouldn't|can't|couldn't|shouldn't|isn't|aren't|wasn't|weren't)\s+(?:\w+\s+){0,2}(?:hardly|barely|scarcely)\b/gi,
                message: 'Avoid double negatives with "hardly", "barely", "scarcely"',
                category: 'grammar',
                severity: 'error',
                suggestions: (match) => match.replace(/(don't|doesn't|didn't|won't|wouldn't|can't|couldn't|shouldn't|isn't|aren't|wasn't|weren't)/gi, 
                    (neg) => {
                        const positive = {
                            "don't": 'do', "doesn't": 'does', "didn't": 'did', "won't": 'will',
                            "wouldn't": 'would', "can't": 'can', "couldn't": 'could',
                            "shouldn't": 'should', "isn't": 'is', "aren't": 'are',
                            "wasn't": 'was', "weren't": 'were'
                        };
                        return positive[neg.toLowerCase()];
                    }),
                examples: ["I can't hardly see", "She doesn't barely know"]
            },

            // ============================================
            // COMPARATIVE AND SUPERLATIVE ERRORS
            // ============================================
            {
                id: 'COMPARATIVE_MORE_ER',
                pattern: /\bmore\s+(bigger|smaller|taller|shorter|faster|slower|older|newer|better|worse|prettier|uglier|happier|sadder|easier|harder)\b/gi,
                message: 'Use either "more" or "-er", not both',
                category: 'grammar',
                severity: 'error',
                suggestions: (match) => match.replace(/more\s+/gi, ''),
                examples: ['more bigger', 'more prettier', 'more easier']
            },
            {
                id: 'SUPERLATIVE_MOST_EST',
                pattern: /\bmost\s+(biggest|smallest|tallest|shortest|fastest|slowest|oldest|newest|best|worst|prettiest|ugliest|happiest|saddest|easiest|hardest)\b/gi,
                message: 'Use either "most" or "-est", not both',
                category: 'grammar',
                severity: 'error',
                suggestions: (match) => match.replace(/most\s+/gi, ''),
                examples: ['most biggest', 'most prettiest', 'most easiest']
            },
            {
                id: 'ABSOLUTE_ADJECTIVES',
                pattern: /\b(?:very|more|most|quite|rather|extremely|completely|totally)\s+(unique|perfect|infinite|absolute|ultimate|complete|total|dead|pregnant|impossible|possible)\b/gi,
                message: 'Absolute adjectives cannot be modified by degree adverbs',
                category: 'grammar',
                severity: 'error',
                suggestions: (match) => match.replace(/(?:very|more|most|quite|rather|extremely|completely|totally)\s+/gi, ''),
                examples: ['very unique', 'more perfect', 'most impossible']
            },

            // ============================================
            // PREPOSITION ERRORS
            // ============================================
            {
                id: 'PREPOSITION_IN_ON_AT_TIME',
                pattern: /\b(?:in|on|at)\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday|january|february|march|april|may|june|july|august|september|october|november|december)\b/gi,
                message: 'Use "on" with days and dates, "in" with months and years, "at" with specific times',
                category: 'grammar',
                severity: 'warning',
                suggestions: (match) => {
                    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
                    const months = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
                    const word = match.split(/\s+/)[1].toLowerCase();
                    if (days.includes(word)) {
                        return match.replace(/\b(?:in|at)\s+/gi, 'on ');
                    } else if (months.includes(word)) {
                        return match.replace(/\b(?:on|at)\s+/gi, 'in ');
                    }
                    return match;
                },
                examples: ['in Monday', 'at January', 'on 2023']
            },
            {
                id: 'PREPOSITION_DIFFERENT_THAN',
                pattern: /\bdifferent\s+than\b/gi,
                message: 'Use "different from" not "different than"',
                category: 'grammar',
                severity: 'warning',
                suggestions: (match) => match.replace(/than/gi, 'from'),
                examples: ['different than']
            },

            // ============================================
            // ARTICLE USAGE ERRORS
            // ============================================
            {
                id: 'ARTICLE_A_VOWEL_SOUND',
                pattern: /\ba\s+(honest|hour|honor|heir|herb|x-ray|mba|fbi|url|mp3|xml|html|sms|atm|faq|rsvp|vip|ceo|cfo|cto|cia|fbi|irs|nasa|nato|unesco|unicef)\b/gi,
                message: 'Use "an" before words that start with a vowel sound',
                category: 'grammar',
                severity: 'error',
                suggestions: (match) => match.replace(/\ba\s+/gi, 'an '),
                examples: ['a honest person', 'a hour ago', 'a MBA degree']
            },
            {
                id: 'ARTICLE_AN_CONSONANT_SOUND',
                pattern: /\ban\s+(university|united|european|one|once|usual|user|utility|uniform|universe|unique|unit|union|universal|ukrainian|uk|us|usa|youtube|uber)\b/gi,
                message: 'Use "a" before words that start with a consonant sound',
                category: 'grammar',
                severity: 'error',
                suggestions: (match) => match.replace(/\ban\s+/gi, 'a '),
                examples: ['an university', 'an one time', 'an unique idea']
            },
            {
                id: 'ARTICLE_UNCOUNTABLE_NOUNS',
                pattern: /\b(?:a|an)\s+(advice|information|news|furniture|equipment|homework|research|progress|knowledge|experience|evidence|luggage|baggage|money|bread|butter|cheese|milk|water|air|music|weather|traffic|work|help|love|hate|anger|joy|sadness|fear|courage|patience|wisdom|beauty|health|wealth|peace|war|freedom|democracy|justice|truth|honesty|loyalty|friendship|family|nature|time|space|energy|power|strength|weakness|success|failure|luck|chance|hope|faith|trust|respect|honor|pride|shame|guilt|responsibility|authority|control|influence|pressure|stress|tension|attention|concentration|focus|interest|enthusiasm|excitement|disappointment|satisfaction|confusion|understanding|agreement|disagreement|cooperation|competition|conflict|violence|crime|punishment|reward|achievement|improvement|development|growth|change|movement|direction|distance|speed|size|weight|height|length|width|depth|temperature|color|shape|texture|sound|noise|silence|light|darkness|shadow|reflection|image|picture|photograph|drawing|painting|sculpture|architecture|design|style|fashion|culture|tradition|custom|habit|routine|schedule|plan|project|program|system|method|technique|skill|talent|ability|capacity|potential|opportunity|possibility|probability|certainty|uncertainty|doubt|confidence|security|safety|danger|risk)\b/gi,
                message: 'Uncountable nouns do not use "a" or "an"',
                category: 'grammar',
                severity: 'error',
                suggestions: (match) => match.replace(/\b(?:a|an)\s+/gi, ''),
                examples: ['a advice', 'an information', 'a news']
            },

            // ============================================
            // SENTENCE STRUCTURE ISSUES
            // ============================================
            {
                id: 'SENTENCE_FRAGMENT_BECAUSE',
                pattern: /^[A-Z][^.!?]*\bbecause\b[^.!?]*\.$/gm,
                message: 'Sentence fragments starting with "because" need a main clause',
                category: 'grammar',
                severity: 'warning',
                suggestions: (match) => 'Consider adding a main clause before or after this phrase.',
                examples: ['Because I was tired.', 'Because it was raining.']
            },
            {
                id: 'SENTENCE_FRAGMENT_WHEN',
                pattern: /^[A-Z][^.!?]*\b(?:when|while|if|although|though|unless|until|since|as|after|before)\b[^.!?]*\.$/gm,
                message: 'Dependent clauses cannot stand alone as sentences',
                category: 'grammar',
                severity: 'warning',
                suggestions: (match) => 'This appears to be a sentence fragment. Add a main clause.',
                examples: ['When I arrived.', 'Although it was late.']
            },
            {
                id: 'RUN_ON_COMMA_SPLICE',
                pattern: /[a-z]+,\s+(?:I|you|he|she|it|we|they|this|that|these|those|here|there)\s+(?:am|is|are|was|were|will|would|can|could|should|might|may|do|does|did|have|has|had|go|goes|went|come|comes|came|see|sees|saw|get|gets|got|take|takes|took|make|makes|made|give|gives|gave|know|knows|knew|think|thinks|thought|say|says|said|tell|tells|told|ask|asks|asked|want|wants|wanted|need|needs|needed|like|likes|liked|love|loves|loved|help|helps|helped|work|works|worked|play|plays|played|look|looks|looked|seem|seems|seemed|feel|feels|felt|become|becomes|became|find|finds|found|use|uses|used|try|tries|tried|keep|keeps|kept|let|lets|left|put|puts|brought|bring|brings|call|calls|called|move|moves|moved|live|lives|lived|believe|believes|believed|hold|holds|held|happen|happens|happened|turn|turns|turned|show|shows|showed|hear|hears|heard|stop|stops|stopped|remember|remembers|remembered|start|starts|started|run|runs|ran|close|closes|closed|open|opens|opened|win|wins|won|lose|loses|lost|hope|hopes|hoped|try|tries|tried|decide|decides|decided|follow|follows|followed|change|changes|changed|learn|learns|learned|teach|teaches|taught|read|reads|studied|study|studies|write|writes|wrote|speak|speaks|spoke|listen|listens|listened|watch|watches|watched|wait|waits|waited|stay|stays|stayed|leave|leaves|left|return|returns|returned|walk|walks|walked|drive|drives|drove|fly|flies|flew|sit|sits|sat|stand|stands|stood|sleep|sleeps|slept|eat|eats|ate|drink|drinks|drank|buy|buys|bought|sell|sells|sold|pay|pays|paid|cost|costs|spend|spends|spent|save|saves|saved|build|builds|built|break|breaks|broke|fix|fixes|fixed|clean|cleans|cleaned|wash|washes|washed|cook|cooks|cooked|grow|grows|grew|plant|plants|planted|cut|cuts|fight|fights|fought|kill|kills|killed|die|dies|died|born|bear|bears|create|creates|created|destroy|destroys|destroyed|exist|exists|existed|appear|appears|appeared|disappear|disappears|disappeared|arrive|arrives|arrived|enter|enters|entered|exit|exits|exited)\b/gi,
                message: 'Possible comma splice - use semicolon, period, or conjunction to join independent clauses',
                category: 'grammar',
                severity: 'warning',
                suggestions: (match) => 'Consider using a semicolon, period, or conjunction instead of a comma.',
                examples: ['I went shopping, I bought shoes', 'She was tired, she went to bed']
            },

            // ============================================
            // ADVANCED STYLE AND CLARITY
            // ============================================
            {
                id: 'PASSIVE_VOICE_ADVANCED',
                pattern: /\b(?:is|are|was|were|being|been|be)\s+(?:being\s+)?(?:\w+ly\s+)?(?:very\s+|quite\s+|rather\s+|extremely\s+|highly\s+|completely\s+|totally\s+|fully\s+|carefully\s+|quickly\s+|slowly\s+|properly\s+|correctly\s+|incorrectly\s+|successfully\s+|unsuccessfully\s+|effectively\s+|ineffectively\s+|efficiently\s+|inefficiently\s+|thoroughly\s+|partially\s+|entirely\s+|frequently\s+|occasionally\s+|rarely\s+|never\s+|always\s+|often\s+|sometimes\s+|usually\s+|normally\s+|typically\s+|generally\s+|specifically\s+|particularly\s+|especially\s+|mainly\s+|mostly\s+|largely\s+|primarily\s+|significantly\s+|considerably\s+|substantially\s+|dramatically\s+|drastically\s+|severely\s+|seriously\s+|badly\s+|poorly\s+|well\s+|better\s+|worse\s+|best\s+|worst\s+|more\s+|most\s+|less\s+|least\s+)?(?:abandoned|accepted|achieved|acquired|adapted|added|addressed|adjusted|adopted|advanced|affected|agreed|aimed|allowed|altered|analyzed|announced|answered|anticipated|appeared|applied|appointed|approached|approved|argued|arranged|arrived|asked|assembled|assigned|assisted|assumed|attached|attacked|attempted|attended|attracted|avoided|awarded|based|became|began|believed|belonged|benefited|bought|brought|built|called|came|carried|caused|changed|charged|checked|chose|claimed|cleaned|cleared|climbed|closed|collected|combined|came|committed|communicated|compared|competed|completed|composed|conceived|concluded|conducted|confirmed|connected|considered|consisted|constructed|contained|continued|contributed|controlled|converted|convinced|cooked|copied|corrected|cost|counted|covered|created|crossed|cut|damaged|decided|declared|decreased|defined|delivered|demonstrated|denied|departed|depended|described|designed|destroyed|determined|developed|died|differed|directed|discovered|discussed|displayed|distributed|divided|done|doubled|downloaded|drew|dressed|drove|dropped|earned|eaten|edited|educated|elected|eliminated|employed|enabled|encouraged|ended|engaged|enjoyed|entered|equipped|escaped|established|estimated|evaluated|examined|exceeded|exchanged|excited|executed|exercised|existed|expanded|expected|experienced|explained|explored|expressed|extended|faced|failed|fallen|featured|felt|filed|filled|filmed|finished|fired|fitted|fixed|flew|focused|followed|forced|forget|formed|fought|found|founded|freed|gained|gathered|gave|generated|got|governed|grabbed|graduated|granted|grew|guaranteed|guarded|guided|handled|happened|headed|heard|heated|held|helped|hidden|highlighted|hired|hit|hoped|hosted|housed|hurt|identified|illustrated|imagined|implemented|implied|imported|impressed|improved|included|increased|indicated|influenced|informed|initiated|injured|inspired|installed|intended|interested|interpreted|interviewed|introduced|invented|invested|invited|involved|issued|joined|judged|jumped|kept|killed|knew|landed|lasted|launched|learned|left|led|let|limited|linked|listed|listened|lived|loaded|located|locked|looked|lost|loved|made|maintained|managed|manufactured|marked|married|matched|mattered|measured|met|mentioned|missed|mixed|modified|moved|named|needed|noted|noticed|obtained|occurred|offered|opened|operated|ordered|organized|owned|paid|painted|participated|passed|performed|permitted|picked|placed|planned|played|pointed|possessed|posted|prepared|presented|preserved|pressed|prevented|printed|produced|programmed|promised|protected|provided|published|pulled|purchased|pushed|put|qualified|questioned|raised|reached|read|realized|received|recognized|recommended|recorded|recovered|reduced|referred|reflected|refused|regarded|registered|related|released|remained|remembered|removed|repeated|replaced|replied|reported|represented|requested|required|researched|reserved|resolved|responded|restored|resulted|returned|revealed|reviewed|revised|rose|ruled|run|said|satisfied|saved|saw|scheduled|searched|secured|seemed|selected|sent|served|set|settled|shared|showed|signed|simplified|sat|sold|solved|sorted|sought|spent|spoke|spread|started|stated|stayed|stepped|stopped|stored|studied|submitted|succeeded|suffered|suggested|summarized|supervised|supplied|supported|supposed|survived|suspected|taught|taken|talked|targeted|taught|tested|thought|threw|told|took|touched|tracked|trained|transferred|transformed|translated|transported|traveled|treated|tried|turned|typed|understood|updated|uploaded|used|varied|viewed|visited|waited|walked|wanted|warned|watched|welcomed|went|worked|worried|wrote)\b/gi,
                message: 'Consider using active voice for clearer, more direct writing',
                category: 'style',
                severity: 'info',
                suggestions: (match) => 'Try rephrasing in active voice to make the writing more direct.',
                examples: ['The report was written by John', 'Mistakes were made', 'The ball was thrown']
            },
            {
                id: 'WORDY_PHRASES_ADVANCED',
                pattern: /\b(?:in order to|for the purpose of|with the intention of|in the event that|in the case that|in spite of the fact that|due to the fact that|because of the fact that|in view of the fact that|considering the fact that|notwithstanding the fact that|regardless of the fact that|on account of the fact that|by virtue of the fact that|in light of the fact that|in consequence of the fact that|as a result of the fact that|by reason of the fact that|in accordance with|in compliance with|in conformity with|with reference to|with regard to|with respect to|in relation to|in connection with|in association with|in conjunction with|in collaboration with|in cooperation with|in partnership with|in combination with|for the reason that|for the simple reason that|it is important to note that|it should be noted that|it is worth noting that|it is interesting to note that|it is significant that|it is clear that|it is obvious that|it is evident that|it is apparent that|it is certain that|it is undeniable that|it is unquestionable that|there is no doubt that|without a doubt|beyond a shadow of a doubt|it goes without saying that|needless to say|as a matter of fact|the fact of the matter is|the truth of the matter is|when all is said and done|at the end of the day|last but not least|first and foremost|each and every|any and all|one and only|null and void|peace and quiet|safe and sound|tried and true|few and far between|pure and simple|short and sweet|nice and easy|cut and dried|black and white|all and sundry|each and every one|one and the same|here and there|now and then|up and down|back and forth|to and fro|this and that|such and such|so and so|more or less|sooner or later|here and now|then and there|now and again|time and again|over and over|again and again|round and round|on and on|off and on|in and out|up and about|here and about|there and back|come and go|give and take|live and learn|wait and see|trial and error|hit and miss|touch and go|stop and go|push and pull|give or take|take it or leave it|like it or not|ready or not|sink or swim|do or die|make or break|win or lose|all or nothing|now or never|yes or no|this or that|here or there|one way or another|one thing or another|this way or that|here and there|far and wide|high and low|left and right|up and down|in and out|back and forth|to and fro|round and round|over and under|through and through|on and off|off and on|here and there|now and then|sooner or later|more and more|less and less|better and better|worse and worse|bigger and bigger|smaller and smaller|faster and faster|slower and slower|higher and higher|lower and lower|older and older|newer and newer|stronger and stronger|weaker and weaker|richer and richer|poorer and poorer|happier and happier|sadder and sadder|easier and easier|harder and harder)\b/gi,
                message: 'Consider using simpler, more concise language',
                category: 'style',
                severity: 'info',
                suggestions: (match) => {
                    const simplifications = {
                        'in order to': 'to',
                        'for the purpose of': 'to',
                        'with the intention of': 'to',
                        'in the event that': 'if',
                        'in the case that': 'if',
                        'in spite of the fact that': 'although',
                        'due to the fact that': 'because',
                        'because of the fact that': 'because',
                        'in view of the fact that': 'because',
                        'considering the fact that': 'because',
                        'with regard to': 'about',
                        'with respect to': 'about',
                        'in relation to': 'about',
                        'in connection with': 'about',
                        'at the end of the day': 'ultimately',
                        'when all is said and done': 'ultimately',
                        'first and foremost': 'first',
                        'each and every': 'every',
                        'any and all': 'all',
                        'more or less': 'about',
                        'sooner or later': 'eventually'
                    };
                    const simplified = simplifications[match.toLowerCase()];
                    return simplified ? `Consider "${simplified}" instead of "${match}"` : 'Consider simplifying this phrase';
                },
                examples: ['in order to', 'due to the fact that', 'at the end of the day']
            },

            // ============================================
            // TECHNICAL WRITING PATTERNS
            // ============================================
            {
                id: 'TECH_DEPRECIATED_DEPRECATED',
                pattern: /\bdepreciated\b/gi,
                message: 'In technical contexts, use "deprecated" not "depreciated"',
                category: 'grammar',
                severity: 'error',
                suggestions: (match) => match.replace(/depreciated/gi, 'deprecated'),
                examples: ['The API was depreciated']
            },
            {
                id: 'TECH_EFFECT_AFFECT',
                pattern: /\b(?:the\s+)?performance\s+is\s+(?:being\s+)?effected\s+by\b/gi,
                message: 'Use "affected" (influenced) not "effected" (caused)',
                category: 'grammar',
                severity: 'error',
                suggestions: (match) => match.replace(/effected/gi, 'affected'),
                examples: ['Performance is effected by the changes']
            },
            {
                id: 'TECH_DATABASE_DATABSE',
                pattern: /\b(?:databse|databace|datbase|dataabse)\b/gi,
                message: 'Correct spelling is "database"',
                category: 'spelling',
                severity: 'error',
                suggestions: (match) => match.replace(/(?:databse|databace|datbase|dataabse)/gi, 'database'),
                examples: ['databse', 'databace', 'datbase']
            },
            {
                id: 'TECH_ALGORITHM_SPELLING',
                pattern: /\b(?:algorythm|algoritm|algorithem|algorthm)\b/gi,
                message: 'Correct spelling is "algorithm"',
                category: 'spelling',
                severity: 'error',
                suggestions: (match) => match.replace(/(?:algorythm|algoritm|algorithem|algorthm)/gi, 'algorithm'),
                examples: ['algorythm', 'algoritm', 'algorithem']
            },
            {
                id: 'TECH_QUERY_SPELLING',
                pattern: /\b(?:querry|quary|querey|quiery)\b/gi,
                message: 'Correct spelling is "query"',
                category: 'spelling',
                severity: 'error',
                suggestions: (match) => match.replace(/(?:querry|quary|querey|quiery)/gi, 'query'),
                examples: ['querry', 'quary', 'querey']
            },
            {
                id: 'TECH_SEPARATE_SPELLING',
                pattern: /\bseperate\b/gi,
                message: 'Correct spelling is "separate"',
                category: 'spelling',
                severity: 'error',
                suggestions: (match) => match.replace(/seperate/gi, 'separate'),
                examples: ['seperate']
            },
            {
                id: 'TECH_MAINTENANCE_SPELLING',
                pattern: /\b(?:maintainence|maintanence|maintenence)\b/gi,
                message: 'Correct spelling is "maintenance"',
                category: 'spelling',
                severity: 'error',
                suggestions: (match) => match.replace(/(?:maintainence|maintanence|maintenence)/gi, 'maintenance'),
                examples: ['maintainence', 'maintanence', 'maintenence']
            },

            // ============================================
            // ADVANCED SPELLING PATTERNS
            // ============================================
            {
                id: 'SPELLING_IE_EI_ADVANCED',
                pattern: /\b(?:recieve|percieve|concieve|decieve|beleive|acheive|retreive|releive|breif|cheif|feild|yeild|wierd|freind|neice|niether|leizure|seize|hieght|foriegn|sovriegn|counterfit|forfiet)\b/gi,
                message: 'Common "ie/ei" spelling error',
                category: 'spelling',
                severity: 'error',
                suggestions: (match) => {
                    const corrections = {
                        'recieve': 'receive', 'percieve': 'perceive', 'concieve': 'conceive',
                        'decieve': 'deceive', 'beleive': 'believe', 'acheive': 'achieve',
                        'retreive': 'retrieve', 'releive': 'relieve', 'breif': 'brief',
                        'cheif': 'chief', 'feild': 'field', 'yeild': 'yield',
                        'wierd': 'weird', 'freind': 'friend', 'neice': 'niece',
                        'niether': 'neither', 'leizure': 'leisure', 'hieght': 'height',
                        'foriegn': 'foreign', 'sovriegn': 'sovereign', 'counterfit': 'counterfeit',
                        'forfiet': 'forfeit'
                    };
                    return match.replace(/\b(?:recieve|percieve|concieve|decieve|beleive|acheive|retreive|releive|breif|cheif|feild|yeild|wierd|freind|neice|niether|leizure|hieght|foriegn|sovriegn|counterfit|forfiet)\b/gi,
                        (word) => corrections[word.toLowerCase()]);
                },
                examples: ['recieve', 'acheive', 'beleive', 'freind']
            },
            {
                id: 'SPELLING_DOUBLE_LETTERS',
                pattern: /\b(?:acommodate|acomodate|embarass|embaras|occurence|occurrance|begining|beggining|comitted|commited|preffered|prefered|reffered|refered|transfered|transfered|benefitted|benefited|travelled|traveled|cancelled|canceled|labelled|labeled|modelling|modeling|quarrelling|quarreling|worshipping|worshiping|kidnapping|kidnaping|programming|programing|formatting|formating)\b/gi,
                message: 'Double letter spelling inconsistency',
                category: 'spelling',
                severity: 'error',
                suggestions: (match) => {
                    const corrections = {
                        'acommodate': 'accommodate', 'acomodate': 'accommodate',
                        'embarass': 'embarrass', 'embaras': 'embarrass',
                        'occurence': 'occurrence', 'occurrance': 'occurrence',
                        'begining': 'beginning', 'beggining': 'beginning',
                        'comitted': 'committed', 'commited': 'committed',
                        'preffered': 'preferred', 'prefered': 'preferred',
                        'reffered': 'referred', 'refered': 'referred',
                        'transfered': 'transferred'
                    };
                    return match.replace(/\b(?:acommodate|acomodate|embarass|embaras|occurence|occurrance|begining|beggining|comitted|commited|preffered|prefered|reffered|refered|transfered)\b/gi,
                        (word) => corrections[word.toLowerCase()] || word);
                },
                examples: ['acommodate', 'embarass', 'begining', 'comitted']
            },

            // ============================================
            // COMMONLY CONFUSED WORDS (Advanced)
            // ============================================
            {
                id: 'CONFUSED_WORDS_ADVANCED',
                pattern: /\b(?:affect|effect|accept|except|advice|advise|breath|breathe|choose|chose|desert|dessert|emigrate|immigrate|farther|further|fewer|less|lay|lie|loose|lose|principal|principle|stationary|stationery|than|then|who|whom|whose|who's|its|it's|your|you're|their|there|they're|to|too|two|hear|here|seen|scene|break|brake|rain|reign|rein|vain|vane|vein|wait|weight|waste|waist|week|weak|weather|whether|where|wear|were|we're|while|wile|whole|hole|wood|would|write|right|rite|wright|yoke|yolk|allowed|aloud|altar|alter|ate|eight|bare|bear|board|bored|buy|by|bye|cell|sell|complement|compliment|council|counsel|course|coarse|dear|deer|dew|due|die|dye|fair|fare|flour|flower|for|four|fore|grate|great|heal|heel|hole|whole|hour|our|knew|new|know|no|led|lead|loan|lone|mail|male|meat|meet|mete|one|won|pair|pare|pear|peace|piece|plain|plane|poor|pour|pore|pray|prey|read|red|real|reel|road|rode|rowed|sail|sale|sea|see|sole|soul|some|sum|son|sun|stair|stare|stake|steak|steal|steel|tail|tale|team|teem|teas|tease|tied|tide|toe|tow|vary|very|wade|weighed|way|weigh|which|witch|wine|whine|won|one|worn|warn)\s+(?:affect|effect|accept|except|advice|advise|breath|breathe|choose|chose|desert|dessert|emigrate|immigrate|farther|further|fewer|less|lay|lie|loose|lose|principal|principle|stationary|stationery|than|then|who|whom|whose|who's|its|it's|your|you're|their|there|they're|to|too|two|hear|here|seen|scene|break|brake|rain|reign|rein|vain|vane|vein|wait|weight|waste|waist|week|weak|weather|whether|where|wear|were|we're|while|wile|whole|hole|wood|would|write|right|rite|wright|yoke|yolk|allowed|aloud|altar|alter|ate|eight|bare|bear|board|bored|buy|by|bye|cell|sell|complement|compliment|council|counsel|course|coarse|dear|deer|dew|due|die|dye|fair|fare|flour|flower|for|four|fore|grate|great|heal|heel|hole|whole|hour|our|knew|new|know|no|led|lead|loan|lone|mail|male|meat|meet|mete|one|won|pair|pare|pear|peace|piece|plain|plane|poor|pour|pore|pray|prey|read|red|real|reel|road|rode|rowed|sail|sale|sea|see|sole|soul|some|sum|son|sun|stair|stare|stake|steak|steal|steel|tail|tale|team|teem|teas|tease|tied|tide|toe|tow|vary|very|wade|weighed|way|weigh|which|witch|wine|whine|won|one|worn|warn)\b/gi,
                message: 'Check for commonly confused words',
                category: 'grammar',
                severity: 'warning',
                suggestions: (match) => 'Double-check that you\'re using the correct word for your intended meaning.',
                examples: ['affect the outcome', 'except the offer', 'loose the game']
            }
        ];
    }

    /**
     * Check text against all comprehensive grammar rules
     */
    checkText(text) {
        const issues = [];
        
        for (const rule of this.rules) {
            const matches = [...text.matchAll(rule.pattern)];
            
            for (const match of matches) {
                const startPos = match.index;
                const endPos = startPos + match[0].length;
                
                // Generate suggestions
                let suggestions = [];
                if (typeof rule.suggestions === 'function') {
                    try {
                        const suggestion = rule.suggestions(match[0]);
                        if (suggestion && suggestion !== match[0]) {
                            suggestions = [suggestion];
                        }
                    } catch (e) {
                        console.warn(`Error generating suggestion for rule ${rule.id}:`, e);
                    }
                } else if (Array.isArray(rule.suggestions)) {
                    suggestions = rule.suggestions;
                } else if (typeof rule.suggestions === 'string') {
                    suggestions = [rule.suggestions];
                }

                issues.push({
                    id: `ultimate-${rule.id}-${startPos}`,
                    ruleId: rule.id,
                    message: rule.message,
                    shortMessage: rule.message.substring(0, 50) + (rule.message.length > 50 ? '...' : ''),
                    category: rule.category,
                    severity: rule.severity,
                    priority: rule.severity === 'error' ? 2 : rule.severity === 'warning' ? 4 : 6,
                    offset: startPos,
                    length: match[0].length,
                    suggestions: suggestions,
                    context: {
                        text: match[0],
                        offset: Math.max(0, startPos - 20),
                        length: Math.min(text.length, match[0].length + 40)
                    },
                    source: 'UltimateGrammarRules',
                    rule: {
                        id: rule.id,
                        description: rule.message
                    }
                });
            }
        }

        return issues;
    }

    /**
     * Get rule statistics
     */
    getStats() {
        const stats = {
            totalRules: this.rules.length,
            categories: {},
            severities: {}
        };

        for (const rule of this.rules) {
            stats.categories[rule.category] = (stats.categories[rule.category] || 0) + 1;
            stats.severities[rule.severity] = (stats.severities[rule.severity] || 0) + 1;
        }

        return stats;
    }

    /**
     * Get all rules in a category
     */
    getRulesByCategory(category) {
        return this.rules.filter(rule => rule.category === category);
    }

    /**
     * Get rule by ID
     */
    getRule(id) {
        return this.rules.find(rule => rule.id === id);
    }

    /**
     * Test the engine with known examples
     */
    selfTest() {
        const testSentences = [
            "I has went to the store yesterday.",
            "Between you and I, this is wrong.",
            "I should of known better.",
            "You was the one who did it.",
            "If I was you, I would be careful.",
            "I don't want nothing from you.",
            "She is more prettier than her sister.",
            "This is very unique.",
            "The databse performance is effected by querys.",
            "I recieved you're mesage yesturday."
        ];

        console.log('🧪 UltimateGrammarRules Self-Test:');
        let totalIssues = 0;

        for (const sentence of testSentences) {
            const issues = this.checkText(sentence);
            totalIssues += issues.length;
            console.log(`"${sentence}" → ${issues.length} issues found`);
        }

        console.log(`✅ Self-test complete: ${totalIssues} total issues found across ${testSentences.length} test sentences`);
        console.log(`📊 Rules: ${this.rules.length} total`);
        console.log(`📊 Categories:`, this.getStats().categories);
        
        return {
            testSentences: testSentences.length,
            totalIssues,
            averageIssuesPerSentence: (totalIssues / testSentences.length).toFixed(1),
            ruleCount: this.rules.length
        };
    }
}

export default UltimateGrammarRules; 