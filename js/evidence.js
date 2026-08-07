// 將字庫的分類層次與引用狀態轉成學生、教師都看得懂的證據卡。
const LSEvidence = (() => {
  const escapeHtml = value => String(value ?? '').replace(/[&<>'"]/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  })[char]);

  function relationText(relation) {
    const related = relation.related_chars?.length ? ` → ${relation.related_chars.join('、')}` : '';
    const method = [relation.relation_basis, relation.relation_status].filter(Boolean).join('／');
    return `${relation.type}${relation.sub ? `・${relation.sub}` : ''}${related}${method ? `（${method}）` : ''}`;
  }

  function render(char, { compact = false } = {}) {
    if (!char) return '';
    const source = Array.isArray(char.sources) ? char.sources[0] : null;
    const relations = Array.isArray(char.usage_relations) ? char.usage_relations : [];
    const scope = char.classification_scope ? `・${char.classification_scope}` : '';
    const formation = char.formation_category
      ? `<span><b>字形構成：</b>${escapeHtml(char.formation_category)}</span>` : '';
    const usage = relations.length
      ? `<span><b>用字關係：</b>${relations.map(relationText).map(escapeHtml).join('；')}</span>` : '';
    const subScope = char.sub_scope ? `<span><b>教學標籤範圍：</b>${escapeHtml(char.sub_scope)}</span>` : '';
    let quote = '';
    if (char.shuowen && char.shuowen_status === '已核對') {
      quote = `<p class="evidence-quote"><b>《說文》條文節錄（已核對）：</b>${escapeHtml(char.shuowen)}</p>`;
    } else if (char.shuowen && char.shuowen_status === '待核') {
      quote = `<p class="evidence-quote is-pending"><b>《說文》候選節錄（待核）：</b>${escapeHtml(char.shuowen)}<br><small>目前不當作已確認的直接引文。</small></p>`;
    } else {
      quote = '<p class="evidence-quote"><b>《說文》條文：</b>本條目前未附，不自行補寫。</p>';
    }
    const safeUrl = source?.url?.startsWith('https://') ? source.url : '';
    const sourceLine = source ? `<p class="evidence-source"><b>來源：</b>${safeUrl ? `<a href="${escapeHtml(safeUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(source.provider)}單字條目</a>` : escapeHtml(source.provider)}<span>${escapeHtml(source.edition)}</span><span>${escapeHtml(source.citation_level)}／${escapeHtml(source.verification_status)}</span><span>存取 ${escapeHtml(source.accessed_at)}</span></p>` : '';
    return `<div class="evidence-block${compact ? ' is-compact' : ''}">
      <p class="evidence-scope"><span><b>本庫主分類：</b>${escapeHtml(char.category)}${escapeHtml(scope)}</span>${formation}${usage}${subScope}</p>
      ${quote}${sourceLine}
      ${relations.some(relation => relation.note) && !compact ? `<p class="evidence-note">${relations.map(relation => relation.note).filter(Boolean).map(escapeHtml).join(' ')}</p>` : ''}
    </div>`;
  }

  return { render };
})();
